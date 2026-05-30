"""current backend schema

Revision ID: 0001_current_schema
Revises: None
Create Date: 2026-05-29 00:00:00
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001_current_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _uuid_type() -> sa.Uuid:
    return sa.Uuid(as_uuid=True)


def _enum_type(name: str, values: Sequence[str]) -> sa.Enum:
    return sa.Enum(*values, name=name)


def _table_names(bind) -> set[str]:
    return set(sa.inspect(bind).get_table_names())


def _column_names(bind, table_name: str) -> set[str]:
    return {column["name"] for column in sa.inspect(bind).get_columns(table_name)}


def _create_table_if_missing(table: sa.Table) -> None:
    table.create(bind=op.get_bind(), checkfirst=True)


def _create_index_if_missing(index: sa.Index) -> None:
    index.create(bind=op.get_bind(), checkfirst=True)


def _add_column_if_missing(table_name: str, column: sa.Column) -> None:
    bind = op.get_bind()
    if table_name not in _table_names(bind):
        return
    if column.name in _column_names(bind, table_name):
        return
    op.add_column(table_name, column)


metadata = sa.MetaData(
    naming_convention={
        "ix": "ix_%(column_0_label)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s",
    }
)

user_role_enum = _enum_type("userrole", ("ADMIN", "SHOP_ACCOUNT"))
unit_type_enum = _enum_type("unittype", ("WEIGHT", "COUNT"))
base_unit_enum = _enum_type("baseunit", ("KG", "UNIT"))
bill_status_enum = _enum_type("billstatus", ("PENDING_PAYMENT", "PAID"))

users = sa.Table(
    "users",
    metadata,
    sa.Column("id", _uuid_type(), primary_key=True, nullable=False),
    sa.Column("username", sa.String(length=50), nullable=False),
    sa.Column("password_hash", sa.String(length=255), nullable=False),
    sa.Column("role", user_role_enum, nullable=False),
    sa.Column("is_active", sa.Boolean(), nullable=False),
    sa.Column(
        "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
    ),
)

shops = sa.Table(
    "shops",
    metadata,
    sa.Column("id", _uuid_type(), primary_key=True, nullable=False),
    sa.Column("name", sa.String(length=120), nullable=False),
    sa.Column("owner_user_id", _uuid_type(), sa.ForeignKey("users.id"), nullable=False),
    sa.Column("is_active", sa.Boolean(), nullable=False),
    sa.Column(
        "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
    ),
    sa.UniqueConstraint("owner_user_id", name="uq_shops_owner_user_id"),
)

items = sa.Table(
    "items",
    metadata,
    sa.Column("id", _uuid_type(), primary_key=True, nullable=False),
    sa.Column(
        "shop_id", _uuid_type(), sa.ForeignKey("shops.id", ondelete="CASCADE"), nullable=True
    ),
    sa.Column("name", sa.String(length=120), nullable=False),
    sa.Column("tamil_name", sa.String(length=120), nullable=True),
    sa.Column("unit_type", unit_type_enum, nullable=False),
    sa.Column("base_unit", base_unit_enum, nullable=False),
    sa.Column("image_object_key", sa.String(length=255), nullable=True),
    sa.Column("image_content_type", sa.String(length=120), nullable=True),
    sa.Column("is_active", sa.Boolean(), nullable=False),
    sa.Column("custom_attributes", sa.JSON(), server_default=sa.text("'{}'"), nullable=False),
    sa.Column(
        "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
    ),
)

shop_item_allocations = sa.Table(
    "shop_item_allocations",
    metadata,
    sa.Column("id", _uuid_type(), primary_key=True, nullable=False),
    sa.Column(
        "shop_id",
        _uuid_type(),
        sa.ForeignKey("shops.id", ondelete="CASCADE"),
        nullable=False,
    ),
    sa.Column(
        "item_id",
        _uuid_type(),
        sa.ForeignKey("items.id", ondelete="CASCADE"),
        nullable=False,
    ),
    sa.Column("custom_attributes", sa.JSON(), server_default=sa.text("'{}'"), nullable=False),
    sa.Column(
        "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
    ),
    sa.UniqueConstraint("shop_id", "item_id", name="uq_shop_item_allocations_shop_item"),
)

daily_prices = sa.Table(
    "daily_prices",
    metadata,
    sa.Column("id", _uuid_type(), primary_key=True, nullable=False),
    sa.Column("shop_id", _uuid_type(), sa.ForeignKey("shops.id"), nullable=False),
    sa.Column("item_id", _uuid_type(), sa.ForeignKey("items.id"), nullable=False),
    sa.Column("price_per_unit", sa.Numeric(10, 2), nullable=False),
    sa.Column("unit", base_unit_enum, nullable=False),
    sa.Column("price_date", sa.Date(), nullable=False),
    sa.Column(
        "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
    ),
    sa.UniqueConstraint(
        "shop_id",
        "item_id",
        "price_date",
        name="uq_daily_price_shop_item_date",
    ),
)

bills = sa.Table(
    "bills",
    metadata,
    sa.Column("id", _uuid_type(), primary_key=True, nullable=False),
    sa.Column("bill_no", sa.String(length=50), nullable=False),
    sa.Column("shop_id", _uuid_type(), sa.ForeignKey("shops.id"), nullable=False),
    sa.Column("total_amount", sa.Numeric(10, 2), nullable=False),
    sa.Column("status", bill_status_enum, nullable=False),
    sa.Column(
        "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
    ),
)

bill_items = sa.Table(
    "bill_items",
    metadata,
    sa.Column("id", _uuid_type(), primary_key=True, nullable=False),
    sa.Column("bill_id", _uuid_type(), sa.ForeignKey("bills.id"), nullable=False),
    sa.Column("item_id", _uuid_type(), sa.ForeignKey("items.id"), nullable=False),
    sa.Column("quantity", sa.Numeric(10, 3), nullable=False),
    sa.Column("unit", base_unit_enum, nullable=False),
    sa.Column("price_per_unit", sa.Numeric(10, 2), nullable=False),
    sa.Column("line_total", sa.Numeric(10, 2), nullable=False),
)

monthly_bill_sequences = sa.Table(
    "monthly_bill_sequences",
    metadata,
    sa.Column("month_year", sa.String(length=7), primary_key=True, nullable=False),
    sa.Column("current_value", sa.Integer(), nullable=False),
)

payments = sa.Table(
    "payments",
    metadata,
    sa.Column("id", _uuid_type(), primary_key=True, nullable=False),
    sa.Column("bill_id", _uuid_type(), sa.ForeignKey("bills.id"), nullable=False),
    sa.Column("cash_amount", sa.Numeric(10, 2), nullable=False),
    sa.Column("upi_amount", sa.Numeric(10, 2), nullable=False),
    sa.Column("total_paid", sa.Numeric(10, 2), nullable=False),
    sa.Column("balance", sa.Numeric(10, 2), nullable=False),
    sa.Column("is_settled", sa.Boolean(), nullable=False),
    sa.UniqueConstraint("bill_id", name="uq_payments_bill_id"),
)

receipts = sa.Table(
    "receipts",
    metadata,
    sa.Column("id", _uuid_type(), primary_key=True, nullable=False),
    sa.Column("bill_id", _uuid_type(), sa.ForeignKey("bills.id"), nullable=False),
    sa.Column("receipt_number", sa.String(length=50), nullable=False),
    sa.Column(
        "printed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
    ),
    sa.UniqueConstraint("bill_id", name="uq_receipts_bill_id"),
)

whatsapp_users = sa.Table(
    "whatsapp_users",
    metadata,
    sa.Column("id", _uuid_type(), primary_key=True, nullable=False),
    sa.Column("phone_number", sa.String(length=20), nullable=False),
    sa.Column("display_name", sa.String(length=255), nullable=True),
    sa.Column("role", sa.String(length=20), nullable=False),
    sa.Column("is_active", sa.Boolean(), nullable=False),
    sa.Column(
        "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
    ),
    sa.Column(
        "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
    ),
)

whatsapp_user_shops = sa.Table(
    "whatsapp_user_shops",
    metadata,
    sa.Column("id", _uuid_type(), primary_key=True, nullable=False),
    sa.Column("user_id", _uuid_type(), sa.ForeignKey("whatsapp_users.id"), nullable=False),
    sa.Column("shop_id", _uuid_type(), sa.ForeignKey("shops.id"), nullable=False),
    sa.UniqueConstraint("user_id", "shop_id", name="uq_whatsapp_user_shop"),
)

whatsapp_conversations = sa.Table(
    "whatsapp_conversations",
    metadata,
    sa.Column("phone_number", sa.String(length=20), primary_key=True, nullable=False),
    sa.Column("stage", sa.String(length=50), nullable=False),
    sa.Column("branch_id", _uuid_type(), nullable=True),
    sa.Column("branch_name", sa.String(length=120), nullable=True),
    sa.Column(
        "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
    ),
)

processed_whatsapp_messages = sa.Table(
    "processed_whatsapp_messages",
    metadata,
    sa.Column("message_id", sa.String(length=255), primary_key=True, nullable=False),
    sa.Column("phone_number", sa.String(length=20), nullable=False),
    sa.Column(
        "received_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
    ),
)

tables = (
    users,
    shops,
    items,
    shop_item_allocations,
    whatsapp_users,
    whatsapp_conversations,
    processed_whatsapp_messages,
    daily_prices,
    bills,
    monthly_bill_sequences,
    bill_items,
    payments,
    receipts,
    whatsapp_user_shops,
)

indexes = (
    sa.Index("ix_users_id", users.c.id),
    sa.Index("ix_users_username", users.c.username, unique=True),
    sa.Index("ix_users_created_at", users.c.created_at),
    sa.Index("ix_items_id", items.c.id),
    sa.Index("ix_items_shop_id", items.c.shop_id),
    sa.Index("ix_shops_id", shops.c.id),
    sa.Index("ix_shops_created_at", shops.c.created_at),
    sa.Index("ix_shop_item_allocations_id", shop_item_allocations.c.id),
    sa.Index("ix_shop_item_allocations_shop_id", shop_item_allocations.c.shop_id),
    sa.Index("ix_shop_item_allocations_item_id", shop_item_allocations.c.item_id),
    sa.Index("ix_shop_item_allocations_created_at", shop_item_allocations.c.created_at),
    sa.Index("ix_daily_prices_id", daily_prices.c.id),
    sa.Index(
        "ix_daily_prices_shop_item_latest",
        daily_prices.c.shop_id,
        daily_prices.c.item_id,
        daily_prices.c.price_date.desc(),
        daily_prices.c.created_at.desc(),
        daily_prices.c.id.desc(),
    ),
    sa.Index(
        "ix_daily_prices_item_latest",
        daily_prices.c.item_id,
        daily_prices.c.price_date.desc(),
        daily_prices.c.created_at.desc(),
        daily_prices.c.id.desc(),
    ),
    sa.Index("ix_bills_id", bills.c.id),
    sa.Index("ix_bills_bill_no", bills.c.bill_no, unique=True),
    sa.Index("ix_bills_shop_id", bills.c.shop_id),
    sa.Index("ix_bills_created_at", bills.c.created_at),
    sa.Index("ix_bills_created_at_id_desc", bills.c.created_at.desc(), bills.c.id.desc()),
    sa.Index(
        "ix_bills_shop_id_created_at_id_desc",
        bills.c.shop_id,
        bills.c.created_at.desc(),
        bills.c.id.desc(),
    ),
    sa.Index(
        "ix_bills_created_at_total_amount_desc",
        bills.c.created_at.desc(),
        bills.c.total_amount.desc(),
    ),
    sa.Index("ix_bill_items_id", bill_items.c.id),
    sa.Index("ix_bill_items_bill_id", bill_items.c.bill_id),
    sa.Index("ix_bill_items_item_id", bill_items.c.item_id),
    sa.Index("ix_payments_id", payments.c.id),
    sa.Index("ix_receipts_id", receipts.c.id),
    sa.Index("ix_receipts_receipt_number", receipts.c.receipt_number, unique=True),
    sa.Index("ix_whatsapp_users_id", whatsapp_users.c.id),
    sa.Index("ix_whatsapp_users_phone_number", whatsapp_users.c.phone_number, unique=True),
    sa.Index("ix_whatsapp_user_shops_id", whatsapp_user_shops.c.id),
)


def upgrade() -> None:
    bind = op.get_bind()

    if bind.dialect.name == "postgresql":
        for enum_type in (user_role_enum, unit_type_enum, base_unit_enum, bill_status_enum):
            enum_type.create(bind, checkfirst=True)

    for table in tables:
        _create_table_if_missing(table)

    if "shops" in _table_names(bind) and "code" in _column_names(bind, "shops"):
        op.drop_column("shops", "code")

    _add_column_if_missing("items", sa.Column("tamil_name", sa.String(length=120), nullable=True))
    _add_column_if_missing(
        "items", sa.Column("image_object_key", sa.String(length=255), nullable=True)
    )
    _add_column_if_missing(
        "items", sa.Column("image_content_type", sa.String(length=120), nullable=True)
    )

    for index in indexes:
        _create_index_if_missing(index)


def downgrade() -> None:
    for table in reversed(tables):
        table.drop(bind=op.get_bind(), checkfirst=True)

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        for enum_type in (bill_status_enum, base_unit_enum, unit_type_enum, user_role_enum):
            enum_type.drop(bind, checkfirst=True)
