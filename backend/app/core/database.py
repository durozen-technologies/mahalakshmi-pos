from collections.abc import AsyncGenerator

from sqlalchemy import MetaData, select
from sqlalchemy.engine import URL, make_url
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

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
SessionLocal = async_sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        await db.close()


async def initialize_database() -> None:
    import app.models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with SessionLocal() as db:
        await seed_defaults(db)


async def seed_defaults(db: AsyncSession) -> None:
    from app.models import BaseUnit, Item, UnitType

    default_items = [
        {"name": "Chicken", "unit_type": UnitType.WEIGHT, "base_unit": BaseUnit.KG},
        {"name": "Chicken without skin", "unit_type": UnitType.WEIGHT, "base_unit": BaseUnit.KG},
        {"name": "Duck", "unit_type": UnitType.COUNT, "base_unit": BaseUnit.UNIT},
        {"name": "Country Chicken", "unit_type": UnitType.WEIGHT, "base_unit": BaseUnit.KG},
        {"name": "Live Country Chicken", "unit_type": UnitType.WEIGHT, "base_unit": BaseUnit.KG},
        {"name": "Live Chicken", "unit_type": UnitType.WEIGHT, "base_unit": BaseUnit.KG},
        {"name": "Chicken Cleaning", "unit_type": UnitType.WEIGHT, "base_unit": BaseUnit.KG},
    ]

    existing_items_result = await db.scalars(select(Item))
    existing_items = {item.name: item for item in existing_items_result.all()}
    for item_payload in default_items:
        item = existing_items.get(item_payload["name"])
        if item is None:
            db.add(Item(**item_payload, is_active=True))
            continue
        item.unit_type = item_payload["unit_type"]
        item.base_unit = item_payload["base_unit"]
        item.is_active = True

    await db.commit()
