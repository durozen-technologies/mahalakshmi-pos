"""Authorization service for WhatsApp bot.

Handles:
- WhatsApp user authorization (which phone numbers can use the bot)
- API key authentication for REST endpoints
"""

import hmac
import logging
from hashlib import sha256
from uuid import UUID

from fastapi import Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import WhatsAppUser, WhatsAppUserShop

logger = logging.getLogger(__name__)


async def is_user_authorized(
    session: AsyncSession,
    phone_number: str,
) -> bool:
    """Check if a WhatsApp user is authorized to use the bot."""
    result = await session.execute(
        select(WhatsAppUser).where(
            WhatsAppUser.phone_number == phone_number,
            WhatsAppUser.is_active.is_(True),
        )
    )
    return result.scalar_one_or_none() is not None


async def get_authorized_user(
    session: AsyncSession,
    phone_number: str,
) -> WhatsAppUser | None:
    """Get the authorized user record for a phone number."""
    result = await session.execute(
        select(WhatsAppUser).where(
            WhatsAppUser.phone_number == phone_number,
            WhatsAppUser.is_active.is_(True),
        )
    )
    return result.scalar_one_or_none()


async def get_user_accessible_shops(
    session: AsyncSession,
    user_id: UUID,
) -> list[UUID]:
    """Get list of shop IDs a user has access to.

    Returns empty list (meaning all shops) if user has no specific restrictions.
    """
    result = await session.execute(
        select(WhatsAppUserShop.shop_id).where(
            WhatsAppUserShop.user_id == user_id,
        )
    )
    return [row[0] for row in result.all()]


async def register_whatsapp_user(
    session: AsyncSession,
    phone_number: str,
    display_name: str | None = None,
    role: str = "user",
    is_active: bool = True,
) -> WhatsAppUser:
    """Register a new WhatsApp user. If already exists, return existing."""
    existing = await get_authorized_user(session, phone_number)
    if existing:
        return existing

    user = WhatsAppUser(
        phone_number=phone_number,
        display_name=display_name,
        role=role,
        is_active=is_active,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


def verify_webhook_signature(
    raw_body: bytes,
    signature_header: str | None,
    app_secret: str | None,
) -> bool:
    """Verify WhatsApp webhook HMAC-SHA256 signature.

    Meta sends X-Hub-Signature-256 header with format: sha256=<hexdigest>
    """
    if not app_secret:
        logger.warning("WHATSAPP_APP_SECRET not configured; skipping signature verification")
        return True

    if not signature_header:
        logger.warning("Missing X-Hub-Signature-256 header")
        return False

    expected_prefix = "sha256="
    if not signature_header.startswith(expected_prefix):
        logger.warning("Invalid signature header format")
        return False

    provided_signature = signature_header[len(expected_prefix):]
    expected_signature = hmac.new(
        app_secret.encode("utf-8"),
        raw_body,
        sha256,
    ).hexdigest()

    return hmac.compare_digest(provided_signature, expected_signature)


async def webhook_signature_verifier(request: Request) -> None:
    """FastAPI dependency to verify WhatsApp webhook signature."""
    from app.config import get_settings

    settings = get_settings()
    app_secret = settings.whatsapp_app_secret

    if not app_secret:
        # If not configured, skip verification
        return

    raw_body = await request.body()
    signature_header = request.headers.get("X-Hub-Signature-256")

    if not verify_webhook_signature(raw_body, signature_header, app_secret):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook signature",
        )


async def verify_api_key(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> None:
    """FastAPI dependency to verify API key for REST endpoints."""
    from app.config import get_settings

    settings = get_settings()
    expected_key = settings.api_key

    if expected_key and (not x_api_key or x_api_key != expected_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )
