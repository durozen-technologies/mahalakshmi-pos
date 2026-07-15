from __future__ import annotations

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool
from sqlalchemy.engine import URL
from sqlalchemy.ext.asyncio import create_async_engine

from app import models as _models  # noqa: F401
from app.core.config import get_settings
from app.db.database import Base, _build_engine_config

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_database_url() -> str:
    return str(get_settings().database_url)


def get_alembic_database_url() -> str:
    database_url = get_database_url()
    if database_url.startswith("sqlite+aiosqlite:"):
        return database_url.replace("sqlite+aiosqlite:", "sqlite:", 1)
    return database_url


def is_async_engine_url(database_url: URL | str) -> bool:
    return "+asyncpg" in str(database_url)


def run_migrations_offline() -> None:
    context.configure(
        url=get_alembic_database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations(database_url: URL | str, connect_args: dict[str, object]) -> None:
    connectable = create_async_engine(
        database_url,
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    database_url, connect_args = _build_engine_config(get_alembic_database_url())
    if is_async_engine_url(database_url):
        asyncio.run(run_async_migrations(database_url, connect_args))
        return

    connectable = create_engine(
        database_url,
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    with connectable.connect() as connection:
        do_run_migrations(connection)


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
