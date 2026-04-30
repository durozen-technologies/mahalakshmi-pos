# Meat Billing System Backend

FastAPI backend for the Billing System. It handles:

- JWT login for admins and shop accounts
- one-time first admin registration
- shop account creation and enable/disable controls
- daily per-shop item pricing
- exact-payment checkout with cash and UPI split
- receipt generation after successful settlement
- audit log tracking for important actions

## Stack

- FastAPI
- SQLAlchemy async
- PostgreSQL via `asyncpg`
- `pwdlib` for password hashing
- `python-jose` for JWT tokens
- `uv` for dependency and runtime management

## Project Layout

```text
backend/
├── app/
│   ├── auth/
│   ├── core/
│   ├── models/
│   ├── routers/
│   ├── schemas/
│   └── services/
├── .env.example
├── main.py
├── pyproject.toml
├── uv.lock
└── README.md
```

## Prerequisites

- Python `3.12+`
- `uv`
- PostgreSQL database

## Environment

Copy the sample file and update values if needed:

```bash
cp .env.example .env
```

Supported settings:

```env
DATABASE_URL=postgresql+asyncpg://postgres:root@localhost:5432/meat_billing
SECRET_KEY=replace-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=720
```

Other backend defaults come from `app/core/config.py`:

- `APP_NAME=Meat Billing System API`
- `API_V1_PREFIX=/api/v1`
- `SHOP_DEFAULT_PASSWORD=ml123`
- `CORS_ORIGINS=["*"]`

## Run Locally

Install dependencies:

```bash
uv sync
```

Start the API:

```bash
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Prefer `uv run uvicorn ...` instead of a global `uvicorn` binary so the app uses the project environment and installed packages.

## Startup Behavior

On startup the app:

- creates database tables from the SQLAlchemy models
- seeds the default billing items if they do not exist yet
- updates the seeded item definitions to match the current code

Seeded items currently include:

- Chicken
- Chicken without skin
- Duck
- Country Chicken
- Live Country Chicken
- Live Chicken
- Chicken Cleaning

## Authentication And Roles

- `admin` users can create and manage shops, view summaries, review bills, and inspect audit logs.
- `shop_account` users can fetch their shop bootstrap data, save today's price sheet, and create bills.
- Only the first admin can be created through public registration.
- Shop logins are generated as `ml1`, `ml2`, `ml3`, and so on.
- New shop accounts use the configured default password, which currently defaults to `ml123`.

## Core Business Rules

- A shop must save today's full price sheet before billing begins.
- Prices are stored as a shop-specific daily snapshot.
- Count-based items accept only whole-number quantities.
- A bill is accepted only when `cash_amount + upi_amount` exactly equals the total.
- Underpayment and overpayment are both rejected.
- Receipt creation happens only after a successful settled payment.

## API Routes

### Utility

- `GET /api/v1/health`

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Admin

- `POST /api/v1/admin/shops`
- `GET /api/v1/admin/shops`
- `PATCH /api/v1/admin/shops/{shop_id}/status`
- `GET /api/v1/admin/sales-summary`
- `GET /api/v1/admin/payment-summary`
- `GET /api/v1/admin/bills`
- `GET /api/v1/admin/audit-logs`

### Shop

- `GET /api/v1/shop/bootstrap`
- `GET /api/v1/shop/daily-prices/today`
- `POST /api/v1/shop/daily-prices`
- `POST /api/v1/shop/bills`

## API Docs

When the server is running:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## Frontend Connectivity

The Expo frontend must call a reachable API host. Common cases:

- Android emulator: `http://10.0.2.2:8000`
- iOS simulator: `http://127.0.0.1:8000`
- Local web: `http://127.0.0.1:8000`
- Physical phone on Wi-Fi: `http://<your-lan-ip>:8000`

Example:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:8000 npx expo start --lan
```

If you start Expo with `--tunnel`, expose the backend separately and point the frontend at that public backend URL.

## Current Gaps

- No Alembic migrations yet
- No automated backend test suite yet
- No printer integration yet; the frontend currently shows a plain receipt preview
