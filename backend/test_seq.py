import asyncio
from app.core.database import SessionLocal, initialize_database
from app.services.billing import _generate_bill_no
from app.models import Shop

async def main():
    await initialize_database()
    async with SessionLocal() as db:
        print(await _generate_bill_no(db, Shop()))

if __name__ == "__main__":
    asyncio.run(main())
