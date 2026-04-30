from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_active_user
from app.core.database import get_db
from app.models import DailyPrice, User, UserRole
from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest, UserSession
from app.services.auth import login_user, register_admin

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> LoginResponse:
    return await login_user(db, payload.username, payload.password)


@router.post("/register", response_model=LoginResponse, status_code=201)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> LoginResponse:
    return await register_admin(db, payload)


@router.get("/me", response_model=UserSession)
async def me(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> UserSession:
    requires_price_setup = False
    next_screen = "admin_dashboard"
    shop_id = None
    shop_name = None

    if current_user.role == UserRole.SHOP_ACCOUNT and current_user.shop is not None:
        shop_id = current_user.shop.id
        shop_name = current_user.shop.name
        requires_price_setup = (
            await db.scalar(
                select(DailyPrice.id).where(
                    DailyPrice.shop_id == current_user.shop.id,
                    DailyPrice.price_date == date.today(),
                )
            )
            is None
        )
        next_screen = "daily_price_setup" if requires_price_setup else "billing"

    return UserSession(
        id=current_user.id,
        username=current_user.username,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        shop_id=shop_id,
        shop_name=shop_name,
        requires_price_setup=requires_price_setup,
        next_screen=next_screen,
    )
