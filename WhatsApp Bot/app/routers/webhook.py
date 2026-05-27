import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status

from app.config import get_settings
from app.dependencies import get_bot_orchestrator
from app.schemas import WebhookProcessResponse, WhatsAppWebhookPayload
from app.services.auth_service import webhook_signature_verifier
from app.services.bot import BotOrchestrator

router = APIRouter(prefix="/webhooks/whatsapp", tags=["whatsapp"])
logger = logging.getLogger(__name__)


@router.get("")
async def verify_whatsapp_webhook(
    hub_mode: str = Query(..., alias="hub.mode"),
    hub_verify_token: str = Query(..., alias="hub.verify_token"),
    hub_challenge: str = Query(..., alias="hub.challenge"),
) -> Response:
    settings = get_settings()
    expected_token = (settings.whatsapp_verify_token or "").strip()
    provided_token = hub_verify_token.strip()
    if hub_mode != "subscribe" or provided_token != expected_token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid verify token.")
    return Response(content=hub_challenge, media_type="text/plain")


@router.post("", response_model=WebhookProcessResponse, status_code=status.HTTP_202_ACCEPTED)
async def receive_whatsapp_webhook(
    request: Request,
    payload: WhatsAppWebhookPayload,
    _: None = Depends(webhook_signature_verifier),
    orchestrator: BotOrchestrator = Depends(get_bot_orchestrator),
) -> WebhookProcessResponse:
    raw_payload = await request.json()
    entries = raw_payload.get("entry", []) if isinstance(raw_payload, dict) else []
    changes = sum(len(entry.get("changes", [])) for entry in entries if isinstance(entry, dict))
    raw_messages = 0
    raw_statuses = 0
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        for change in entry.get("changes", []):
            if not isinstance(change, dict):
                continue
            value = change.get("value", {})
            if isinstance(value, dict):
                raw_messages += len(value.get("messages", []) or [])
                raw_statuses += len(value.get("statuses", []) or [])

    processed_messages = await orchestrator.handle_webhook(payload)
    logger.info(
        "WhatsApp webhook received: entries=%s changes=%s messages=%s statuses=%s processed_messages=%s",
        len(entries),
        changes,
        raw_messages,
        raw_statuses,
        processed_messages,
    )
    return WebhookProcessResponse(processed_messages=processed_messages)
