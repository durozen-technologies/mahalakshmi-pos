"""Apply database schema updates (create_all + incremental column fixes)."""

import asyncio
import logging

from app.db.database import initialize_database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main() -> None:
    logger.info("Running database migrations...")
    await initialize_database()
    logger.info("Database migrations completed.")


if __name__ == "__main__":
    asyncio.run(main())
