from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.schemas import BranchRead
from app.services.sales import list_active_branches

router = APIRouter(prefix="/api/branches", tags=["branches"])


@router.get("", response_model=list[BranchRead])
async def get_branches(session: AsyncSession = Depends(get_db_session)) -> list[BranchRead]:
    return await list_active_branches(session)
