from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import Shop, User, UserRole

settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_v1_prefix}/auth/login")


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
    except (JWTError, KeyError, TypeError, ValueError) as exc:
        raise credentials_exception from exc

    user = await db.get(User, user_id, options=(selectinload(User.shop),))
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")
    if current_user.role == UserRole.SHOP_ACCOUNT and current_user.shop and not current_user.shop.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Shop account is disabled")
    return current_user


def require_roles(*roles: UserRole) -> Callable[[User], User]:
    async def dependency(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user

    return dependency


async def get_current_shop(
    current_user: User = Depends(require_roles(UserRole.SHOP_ACCOUNT)),
    db: AsyncSession = Depends(get_db),
) -> Shop:
    shop = await db.scalar(select(Shop).where(Shop.owner_user_id == current_user.id))
    if shop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop account not linked")
    if not shop.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Shop is inactive")
    return shop
