from functools import lru_cache

from app.config import Settings, get_settings
from app.services.bot import BotOrchestrator, ConversationStore, WhatsAppClient


@lru_cache
def get_conversation_store() -> ConversationStore:
    return ConversationStore()


@lru_cache
def get_whatsapp_client() -> WhatsAppClient:
    return WhatsAppClient(get_settings())


@lru_cache
def get_bot_orchestrator() -> BotOrchestrator:
    settings: Settings = get_settings()
    return BotOrchestrator(
        settings=settings,
        conversation_store=get_conversation_store(),
        whatsapp_client=get_whatsapp_client(),
    )
