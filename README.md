# Billing System

Mobile-first meat billing system with:

- a FastAPI backend for authentication, shop management, daily pricing, billing, receipts, and audit logs
- an Expo React Native frontend for admin and shop operators

The project is split into two app folders:

- `backend/` for the API and database layer
- `frontend/` for the mobile and web client

## Product Flow

1. Create the first admin account from the login screen or `POST /api/v1/auth/register`.
2. Admin creates shop accounts from the dashboard.
3. Shop users log in with generated usernames like `ml1`, `ml2`, `ml3`.
4. Each shop sets the full daily price sheet before billing starts.
5. Counter staff add items to the cart and move to checkout.
6. The backend accepts a bill only when cash plus UPI exactly matches the total.
7. A settled receipt and audit log entry are created immediately after checkout.

## Tech Stack

- Backend: FastAPI, SQLAlchemy async, PostgreSQL, JWT auth, `uv`
- Frontend: Expo 54, React Native, TypeScript, React Navigation, Zustand, React Hook Form, NativeWind

## Repository Layout

```text
.
├── backend/
│   ├── app/
│   ├── .env.example
│   ├── main.py
│   ├── pyproject.toml
│   └── README.md
├── frontend/
│   ├── src/
│   ├── App.tsx
│   ├── package.json
│   └── README.md
└── README.md
```

## Prerequisites

- Python `3.12+`
- `uv`
- PostgreSQL
- Node.js `18+`
- npm
- Android emulator, iOS simulator, Expo Go, or web browser for the frontend

## Quick Start

### 1. Start the Backend

```bash
cd backend
cp .env.example .env
uv sync
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend creates tables on startup and seeds the default billing items automatically.

### 2. Start the Frontend

```bash
cd frontend
npm install
npx expo start
```

If you need a custom backend host, set `EXPO_PUBLIC_API_BASE_URL` before starting Expo:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:8000 npx expo start --lan
```

## Default Access Rules

- First admin registration is allowed only once.
- New shop accounts get usernames in `ml<number>` format.
- Default shop password comes from the backend setting `shop_default_password` and currently defaults to `ml123`.
- Disabled shops cannot log in or create bills.

## Networking Notes

- Backend bind address `0.0.0.0` is not a usable frontend URL by itself.
- Android emulator usually needs `http://10.0.2.2:8000`.
- iOS simulator and local web usually use `http://127.0.0.1:8000`.
- On a phone, point the frontend to your computer's LAN IP or a public backend tunnel.
- Expo tunnel mode shares the JavaScript bundle, not the backend API.

## Helpful URLs

- API docs: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- Health check: `http://127.0.0.1:8000/api/v1/health`

## Documentation By App

- Backend setup and API notes: [backend/README.md](backend/README.md)
- Frontend setup and operator flow: [frontend/README.md](frontend/README.md)
