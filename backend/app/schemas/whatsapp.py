from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field

from ..models import BaseUnit
from .common import ORMModel


class BranchRead(ORMModel):
    id: UUID
    name: str
    is_active: bool


class SalesSummaryItem(BaseModel):
    item_id: UUID
    item_name: str
    total_quantity: Decimal
    unit: BaseUnit
    total_revenue: Decimal


class SalesSummaryResponse(BaseModel):
    shop_id: UUID
    shop_name: str
    from_date: date
    to_date: date
    items: list[SalesSummaryItem]


class HealthResponse(BaseModel):
    status: str
    whatsapp_configured: bool


class WebhookProcessResponse(BaseModel):
    processed_messages: int


class WhatsAppProfile(BaseModel):
    name: str | None = None


class WhatsAppContact(BaseModel):
    wa_id: str
    profile: WhatsAppProfile | None = None


class WhatsAppMetadata(BaseModel):
    display_phone_number: str | None = None
    phone_number_id: str | None = None


class WhatsAppText(BaseModel):
    body: str


class WhatsAppInteractiveReply(BaseModel):
    id: str
    title: str | None = None
    description: str | None = None


class WhatsAppInteractive(BaseModel):
    type: str
    button_reply: WhatsAppInteractiveReply | None = None
    list_reply: WhatsAppInteractiveReply | None = None


class WhatsAppButton(BaseModel):
    text: str | None = None
    payload: str | None = None


class WhatsAppMessage(BaseModel):
    id: str
    from_phone: str = Field(alias="from")
    timestamp: str | None = None
    type: str
    text: WhatsAppText | None = None
    interactive: WhatsAppInteractive | None = None
    button: WhatsAppButton | None = None


class WhatsAppValue(BaseModel):
    metadata: WhatsAppMetadata | None = None
    contacts: list[WhatsAppContact] = Field(default_factory=list)
    messages: list[WhatsAppMessage] = Field(default_factory=list)


class WhatsAppChange(BaseModel):
    value: WhatsAppValue


class WhatsAppEntry(BaseModel):
    changes: list[WhatsAppChange] = Field(default_factory=list)


class WhatsAppWebhookPayload(BaseModel):
    object: str | None = None
    entry: list[WhatsAppEntry] = Field(default_factory=list)


class IncomingMessageKind(str, Enum):
    TEXT = "text"
    INTERACTIVE = "interactive"


class IncomingUserMessage(BaseModel):
    phone_number: str
    message_id: str
    display_name: str | None = None
    content: str
    kind: IncomingMessageKind


class BotStage(str, Enum):
    AWAITING_BRANCH = "awaiting_branch"
    AWAITING_ACTION = "awaiting_action"
    AWAITING_DATE_RANGE = "awaiting_date_range"


class ConversationState(BaseModel):
    phone_number: str
    stage: BotStage = BotStage.AWAITING_BRANCH
    branch_id: UUID | None = None
    branch_name: str | None = None
    last_branch_prompt_at: datetime | None = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
