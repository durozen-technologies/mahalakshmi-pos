from uuid import UUID

from sqlalchemy import JSON, ForeignKey, String
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import Mapped, mapped_column

from ..core.ids import UUID_SQL_TYPE, uuid7
from ..db.database import Base
from .base import BaseModelMixin


class ItemChangeEvent(Base, BaseModelMixin):
    __tablename__ = "item_change_events"

    id: Mapped[UUID] = mapped_column(UUID_SQL_TYPE, primary_key=True, index=True, default=uuid7)
    item_id: Mapped[UUID | None] = mapped_column(
        UUID_SQL_TYPE, ForeignKey("items.id", ondelete="SET NULL"), index=True, nullable=True
    )
    shop_id: Mapped[UUID | None] = mapped_column(
        UUID_SQL_TYPE, ForeignKey("shops.id", ondelete="SET NULL"), index=True, nullable=True
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    before: Mapped[dict[str, object | None]] = mapped_column(
        MutableDict.as_mutable(JSON),
        default=dict,
        nullable=False,
    )
    after: Mapped[dict[str, object | None]] = mapped_column(
        MutableDict.as_mutable(JSON),
        default=dict,
        nullable=False,
    )
