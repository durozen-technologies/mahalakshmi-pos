# WhatsApp Bot

FastAPI-based WhatsApp sales bot for the Billing System.

## Shared Models And Schemas

This app reuses the backend package as the source of truth for shared data structures:

- shared SQLAlchemy models: [`../backend/app/models/`](../backend/app/models/)
- shared Pydantic schemas: [`../backend/app/schemas/`](../backend/app/schemas/)
- WhatsApp-specific shared models: [`../backend/app/models/whatsapp.py`](../backend/app/models/whatsapp.py)
- WhatsApp-specific shared schemas: [`../backend/app/schemas/whatsapp.py`](../backend/app/schemas/whatsapp.py)

Inside the bot:

- [`app/models.py`](app/models.py) re-exports from `backend.app.models`
- [`app/schemas.py`](app/schemas.py) re-exports from `backend.app.schemas`

When you need to add a shared entity or schema for both services, update `backend.app` first and keep the bot files as shims.

## Run Locally

```bash
cd "WhatsApp Bot"
uv sync
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

The bot expects repo-root imports to be available so it can resolve `backend.app.*` while still keeping its own FastAPI app package in `WhatsApp Bot/app/`.

If your shell is already inside a nested folder like `frontend/android`, first return to the repo root or use:

```bash
cd ../../WhatsApp\ Bot
```
