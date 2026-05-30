import logging
from collections.abc import AsyncGenerator

from sqlalchemy import MetaData, func, inspect, select, text
from sqlalchemy.engine import URL, Connection, make_url
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from ..core.config import get_settings
from ..core.ids import uuid7
from .default_items import DEFAULT_ITEM_DEFINITIONS, DEFAULT_ITEM_IMAGE_PATHS

settings = get_settings()
logger = logging.getLogger(__name__)

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


def _build_engine_config(database_url: str) -> tuple[URL | str, dict[str, str]]:
    url = make_url(database_url)
    connect_args: dict[str, str] = {}

    if url.drivername in {"postgres", "postgresql"}:
        url = url.set(drivername="postgresql+asyncpg")

    sslmode = url.query.get("sslmode")
    if sslmode:
        connect_args["ssl"] = sslmode
        url = url.set(query={key: value for key, value in url.query.items() if key != "sslmode"})

    return url, connect_args


engine: AsyncEngine | None = None
SessionLocal: async_sessionmaker[AsyncSession] | None = None
UUID_IDENTIFIER_COLUMNS = {
    "bill_items": {"id", "bill_id", "item_id"},
    "bills": {"id", "shop_id"},
    "daily_prices": {"id", "shop_id", "item_id"},
    "items": {"id", "category_id"},
    "item_categories": {"id"},
    "item_change_events": {"id", "item_id", "shop_id"},
    "payments": {"id", "bill_id"},
    "receipts": {"id", "bill_id"},
    "shop_item_allocations": {"id", "shop_id", "item_id"},
    "shops": {"id", "owner_user_id"},
    "users": {"id"},
}


def get_engine() -> AsyncEngine:
    global engine
    if engine is None:
        engine_url, engine_connect_args = _build_engine_config(settings.database_url)
        engine = create_async_engine(
            engine_url,
            future=True,
            connect_args=engine_connect_args,
            pool_pre_ping=True,
            pool_size=settings.db_pool_size,
            max_overflow=settings.db_max_overflow,
            pool_timeout=settings.db_pool_timeout,
            pool_recycle=settings.db_pool_recycle,
        )
    return engine


def get_session_local() -> async_sessionmaker[AsyncSession]:
    global SessionLocal
    if SessionLocal is None:
        SessionLocal = async_sessionmaker(
            bind=get_engine(), autoflush=False, expire_on_commit=False
        )
    return SessionLocal


async def close_database_connections() -> None:
    global engine, SessionLocal

    if engine is not None:
        await engine.dispose()
    engine = None
    SessionLocal = None


def _ensure_indexes(sync_conn: Connection) -> None:
    for table in Base.metadata.sorted_tables:
        for index in table.indexes:
            index.create(bind=sync_conn, checkfirst=True)


def _drop_legacy_shop_code_column(sync_conn: Connection) -> None:
    inspector = inspect(sync_conn)
    if "shops" not in set(inspector.get_table_names()):
        return

    column_names = {column["name"] for column in inspector.get_columns("shops")}
    if "code" not in column_names:
        return

    sync_conn.execute(text("ALTER TABLE shops DROP COLUMN code"))


def _ensure_uuid_identifier_columns(sync_conn: Connection) -> None:
    inspector = inspect(sync_conn)
    table_names = set(inspector.get_table_names())
    incompatible_columns: list[str] = []

    for table_name, column_names in UUID_IDENTIFIER_COLUMNS.items():
        if table_name not in table_names:
            continue

        columns = {column["name"]: column["type"] for column in inspector.get_columns(table_name)}
        for column_name in column_names:
            column_type = columns.get(column_name)
            if column_type is None:
                continue

            rendered_type = str(column_type).lower()
            if "uuid" in rendered_type or rendered_type.startswith("char"):
                continue

            incompatible_columns.append(f"{table_name}.{column_name} ({column_type})")

    if incompatible_columns:
        joined_columns = ", ".join(sorted(incompatible_columns))
        raise RuntimeError(
            "Database schema still uses legacy non-UUID identifier columns: "
            f"{joined_columns}. Reset the database or run a manual PK/FK migration to UUIDv7."
        )


def _ensure_item_image_columns(sync_conn: Connection) -> None:
    inspector = inspect(sync_conn)
    if "items" not in set(inspector.get_table_names()):
        return

    column_names = {column["name"] for column in inspector.get_columns("items")}
    if "image_object_key" not in column_names:
        sync_conn.execute(text("ALTER TABLE items ADD COLUMN image_object_key VARCHAR(255)"))
    if "image_content_type" not in column_names:
        sync_conn.execute(text("ALTER TABLE items ADD COLUMN image_content_type VARCHAR(120)"))


def _ensure_item_tamil_name_column(sync_conn: Connection) -> None:
    inspector = inspect(sync_conn)
    if "items" not in set(inspector.get_table_names()):
        return

    column_names = {column["name"] for column in inspector.get_columns("items")}
    if "tamil_name" not in column_names:
        sync_conn.execute(text("ALTER TABLE items ADD COLUMN tamil_name VARCHAR(120)"))


def _ensure_item_category_schema(sync_conn: Connection) -> None:
    """Compatibility guard for direct API starts before Alembic has run.

    Alembic remains the canonical migration path. This small idempotent guard
    prevents a newer app process from crashing on ``items.category_id`` when a
    local or manually started backend points at an older database.
    """
    inspector = inspect(sync_conn)
    table_names = set(inspector.get_table_names())
    dialect = sync_conn.dialect.name

    if "item_categories" not in table_names:
        if dialect == "postgresql":
            sync_conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS item_categories (
                        id UUID PRIMARY KEY,
                        name VARCHAR(80) NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        CONSTRAINT ck_item_categories_name_not_blank CHECK (length(trim(name)) >= 1)
                    )
                    """
                )
            )
        else:
            sync_conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS item_categories (
                        id CHAR(32) PRIMARY KEY,
                        name VARCHAR(80) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        CONSTRAINT ck_item_categories_name_not_blank CHECK (length(trim(name)) >= 1)
                    )
                    """
                )
            )

    if dialect == "postgresql":
        sync_conn.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_item_categories_lower_name "
                "ON item_categories (lower(name))"
            )
        )
    else:
        sync_conn.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_item_categories_lower_name "
                "ON item_categories (lower(name))"
            )
        )

    table_names = set(inspect(sync_conn).get_table_names())
    if "items" not in table_names:
        return

    item_columns = {column["name"] for column in inspect(sync_conn).get_columns("items")}
    if "category_id" not in item_columns:
        if dialect == "postgresql":
            sync_conn.execute(text("ALTER TABLE items ADD COLUMN IF NOT EXISTS category_id UUID"))
        else:
            sync_conn.execute(text("ALTER TABLE items ADD COLUMN category_id CHAR(32)"))

    if dialect == "postgresql":
        sync_conn.execute(text("CREATE INDEX IF NOT EXISTS ix_items_category_id ON items (category_id)"))
        foreign_key_names = {
            key["name"] for key in inspect(sync_conn).get_foreign_keys("items") if key.get("name")
        }
        if "fk_items_category_id_item_categories" not in foreign_key_names:
            sync_conn.execute(
                text(
                    """
                    ALTER TABLE items
                    ADD CONSTRAINT fk_items_category_id_item_categories
                    FOREIGN KEY (category_id) REFERENCES item_categories(id) ON DELETE SET NULL
                    """
                )
            )
    else:
        sync_conn.execute(text("CREATE INDEX IF NOT EXISTS ix_items_category_id ON items (category_id)"))

    category_rows = sync_conn.execute(
        text(
            """
            SELECT DISTINCT trim(category) AS name
            FROM items
            WHERE category IS NOT NULL AND trim(category) != ''
            """
        )
    ).mappings()
    existing_categories = {
        str(row["name"]).strip().lower(): row["id"]
        for row in sync_conn.execute(text("SELECT id, name FROM item_categories")).mappings()
    }
    for row in category_rows:
        category_name = str(row["name"]).strip()
        key = category_name.lower()
        category_id = existing_categories.get(key)
        if category_id is None:
            category_id = uuid7()
            bound_category_id = category_id if dialect == "postgresql" else str(category_id)
            sync_conn.execute(
                text(
                    """
                    INSERT INTO item_categories (id, name)
                    VALUES (:category_id, :category_name)
                    """
                ),
                {"category_id": bound_category_id, "category_name": category_name},
            )
            existing_categories[key] = bound_category_id
            category_id = bound_category_id
        sync_conn.execute(
            text(
                """
                UPDATE items
                SET category_id = :category_id,
                    category = :category_name
                WHERE lower(trim(category)) = :category_key
                """
            ),
            {
                "category_id": category_id,
                "category_name": category_name,
                "category_key": key,
            },
        )


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    db = get_session_local()()
    try:
        yield db
    finally:
        await db.close()


async def initialize_database() -> None:
    await run_database_startup_tasks()


async def migrate_legacy_item_images_before_schema_changes() -> None:
    async with get_session_local()() as db:
        from .storage import migrate_item_image_data_to_rustfs

        migrated_image_count = await migrate_item_image_data_to_rustfs(db)
        if migrated_image_count:
            logger.info(
                "Pre-schema migration moved/cleared %s legacy database item image(s).",
                migrated_image_count,
            )


async def run_database_startup_tasks() -> None:
    from .. import models as _models  # noqa: F401

    async with get_engine().begin() as conn:
        await conn.run_sync(_ensure_item_category_schema)
        await conn.run_sync(_ensure_uuid_identifier_columns)
    async with get_session_local()() as db:
        from .storage import migrate_item_image_data_to_rustfs

        migrated_image_count = await migrate_item_image_data_to_rustfs(db)
        if migrated_image_count:
            logger.info(
                "Database initialization migrated/cleared %s legacy database item image(s).",
                migrated_image_count,
            )


async def _upsert_default_items(db: AsyncSession):
    from ..models import BaseUnit, Item, ItemCategory, UnitType

    existing_items_result = await db.scalars(select(Item))
    existing_items = {item.name: item for item in existing_items_result.all()}
    category_names = sorted(
        {
            str(item_definition["category"]).strip()
            for item_definition in DEFAULT_ITEM_DEFINITIONS
            if item_definition.get("category") and str(item_definition["category"]).strip()
        }
    )
    existing_categories_result = await db.scalars(
        select(ItemCategory).where(
            func.lower(ItemCategory.name).in_([name.lower() for name in category_names])
        )
    )
    categories_by_name = {
        category.name.strip().lower(): category for category in existing_categories_result.all()
    }
    for category_name in category_names:
        key = category_name.lower()
        if key not in categories_by_name:
            category = ItemCategory(name=category_name)
            db.add(category)
            categories_by_name[key] = category

    for item_definition in DEFAULT_ITEM_DEFINITIONS:
        category_name = item_definition.get("category")
        category = (
            categories_by_name.get(str(category_name).strip().lower())
            if category_name and str(category_name).strip()
            else None
        )
        item_payload = {
            "name": item_definition["name"],
            "tamil_name": item_definition["tamil_name"],
            "unit_type": UnitType[item_definition["unit_type"]],
            "base_unit": BaseUnit[item_definition["base_unit"]],
            "sort_order": item_definition.get("sort_order", 0),
            "category": item_definition.get("category"),
        }
        item = existing_items.get(item_payload["name"])
        if item is None:
            item = Item(**item_payload, is_active=True, category_ref=category)
            db.add(item)
            existing_items[item.name] = item
            continue
        item.tamil_name = item_payload["tamil_name"]
        item.unit_type = item_payload["unit_type"]
        item.base_unit = item_payload["base_unit"]
        item.sort_order = item_payload["sort_order"]
        item.category = item_payload["category"]
        item.category_ref = category
        item.is_active = True

    await db.flush()
    return existing_items


async def seed_defaults(db: AsyncSession) -> None:
    await _upsert_default_items(db)
    await db.commit()


async def seed_defaults_with_images(
    db: AsyncSession,
    *,
    force_image_refresh: bool = False,
) -> int:
    existing_items = await _upsert_default_items(db)
    if not settings.rustfs_enabled:
        logger.info("RustFS is not configured; skipping bundled default item image refresh.")
        await db.commit()
        return 0

    (
        uploaded_count,
        uploaded_object_keys,
        stale_object_keys,
    ) = await _seed_default_item_images_for_items(
        db,
        existing_items,
        force=force_image_refresh,
    )
    try:
        await db.commit()
    except Exception:
        for object_key in uploaded_object_keys:
            await delete_default_item_image_storage(object_key)
        raise
    for object_key in stale_object_keys:
        await delete_default_item_image_storage(object_key)
    return uploaded_count


async def _seed_default_item_images_for_items(
    db: AsyncSession,
    existing_items_by_name,
    *,
    force: bool = False,
) -> tuple[int, list[str], list[str]]:
    from .storage import save_item_image_content

    uploaded_count = 0
    uploaded_object_keys: list[str] = []
    stale_object_keys: list[str] = []
    for item_definition in DEFAULT_ITEM_DEFINITIONS:
        item_name = item_definition["name"]
        image_path = item_definition["image_path"]
        item = existing_items_by_name.get(item_name)
        if item is None:
            logger.warning(
                "Skipping default image seed for %s because the item was not found.",
                item_name,
            )
            continue
        if not force and item.image_content_type and item.image_object_key:
            continue
        if not image_path.is_file():
            logger.warning(
                "Skipping default image seed for %s because the file was not found at %s.",
                item_name,
                image_path,
            )
            continue

        previous_object_key = item.image_object_key
        await save_item_image_content(
            db,
            item,
            filename=image_path.name,
            content=image_path.read_bytes(),
            commit=False,
        )
        if item.image_object_key and previous_object_key != item.image_object_key:
            uploaded_object_keys.append(item.image_object_key)
        if previous_object_key and previous_object_key != item.image_object_key:
            stale_object_keys.append(previous_object_key)
        uploaded_count += 1

    return uploaded_count, uploaded_object_keys, stale_object_keys


async def seed_default_item_images(
    db: AsyncSession,
    *,
    force: bool = False,
) -> int:
    if not settings.rustfs_enabled:
        logger.info("RustFS is not configured; skipping default item image seed.")
        return 0

    from ..models import Item

    existing_items_result = await db.scalars(
        select(Item).where(Item.name.in_(tuple(DEFAULT_ITEM_IMAGE_PATHS)))
    )
    existing_items = {item.name: item for item in existing_items_result.all()}
    (
        uploaded_count,
        uploaded_object_keys,
        stale_object_keys,
    ) = await _seed_default_item_images_for_items(
        db,
        existing_items,
        force=force,
    )

    if uploaded_count:
        try:
            await db.commit()
        except Exception:
            for object_key in uploaded_object_keys:
                await delete_default_item_image_storage(object_key)
            raise
        for object_key in stale_object_keys:
            await delete_default_item_image_storage(object_key)
        logger.info("Seeded default images for %s item(s).", uploaded_count)
        return uploaded_count

    return 0


async def delete_default_item_image_storage(object_key: str) -> None:
    from .storage import delete_item_image_storage

    await delete_item_image_storage(object_key)
