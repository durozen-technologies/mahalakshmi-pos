from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from ..core.ids import UUID_SQL_TYPE, uuid7
from ..db.database import Base


class WhatsAppUser(Base):
    __tablename__ = "whatsapp_users"

    id: Mapped[UUID] = mapped_column(UUID_SQL_TYPE, primary_key=True, index=True, default=uuid7)
    phone_number: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(20), default="user", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class WhatsAppUserShop(Base):
    __tablename__ = "whatsapp_user_shops"
    __table_args__ = (UniqueConstraint("user_id", "shop_id", name="uq_whatsapp_user_shop"),)

    id: Mapped[UUID] = mapped_column(UUID_SQL_TYPE, primary_key=True, index=True, default=uuid7)
    user_id: Mapped[UUID] = mapped_column(
        UUID_SQL_TYPE,
        ForeignKey("whatsapp_users.id"),
        nullable=False,
    )
    shop_id: Mapped[UUID] = mapped_column(
        UUID_SQL_TYPE,
        ForeignKey("shops.id"),
        nullable=False,
    )


class WhatsAppConversation(Base):
    __tablename__ = "whatsapp_conversations"

    phone_number: Mapped[str] = mapped_column(String(20), primary_key=True)
    stage: Mapped[str] = mapped_column(String(50), default="awaiting_branch", nullable=False)
    branch_id: Mapped[UUID | None] = mapped_column(UUID_SQL_TYPE, nullable=True)
    branch_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class ProcessedWhatsAppMessage(Base):
    __tablename__ = "processed_whatsapp_messages"

    message_id: Mapped[str] = mapped_column(String(255), primary_key=True)
    phone_number: Mapped[str] = mapped_column(String(20), nullable=False)
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        server_default=func.now(),
        nullable=False,
    )
