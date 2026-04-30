from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import create_access_token, get_password_hash, verify_password
from app.models import DailyPrice, User, UserRole
from app.schemas.auth import LoginResponse, RegisterRequest, UserSession
from app.services.audit import log_action


def _build_user_session(user: User, *, requires_price_setup: bool = False, next_screen: str) -> UserSession:
    return UserSession(
        id=user.id,
        username=user.username,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        shop_id=user.shop.id if user.shop else None,
        shop_name=user.shop.name if user.shop else None,
        requires_price_setup=requires_price_setup,
        next_screen=next_screen,
    )


async def login_user(db: AsyncSession, username: str, password: str) -> LoginResponse:
    user = await db.scalar(select(User).options(selectinload(User.shop)).where(User.username == username))
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")
    if user.role == UserRole.SHOP_ACCOUNT and (user.shop is None or not user.shop.is_active):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Shop account is disabled")

    requires_price_setup = False
    next_screen = "admin_dashboard"

    if user.role == UserRole.SHOP_ACCOUNT and user.shop is not None:
        has_today_price = await db.scalar(
            select(DailyPrice.id).where(
                DailyPrice.shop_id == user.shop.id,
                DailyPrice.price_date == date.today(),
            )
        )
        requires_price_setup = has_today_price is None
        next_screen = "daily_price_setup" if requires_price_setup else "billing"

    token = create_access_token(user.id)
    log_action(db, user.id, "login", f"User {user.username} logged in")
    await db.commit()

    session = _build_user_session(
        user,
        requires_price_setup=requires_price_setup,
        next_screen=next_screen,
    )
    return LoginResponse(access_token=token, user=session)


async def register_admin(db: AsyncSession, payload: RegisterRequest) -> LoginResponse:
    existing_admin = await db.scalar(select(User.id).where(User.role == UserRole.ADMIN))
    if existing_admin is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Admin registration is already completed",
        )

    existing_user = await db.scalar(select(User.id).where(User.username == payload.username))
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists",
        )

    user = User(
        username=payload.username,
        password_hash=get_password_hash(payload.password),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    log_action(db, user.id, "register_admin", f"Registered admin account {user.username}")
    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id)
    session = _build_user_session(user, next_screen="admin_dashboard")
    return LoginResponse(access_token=token, user=session)
