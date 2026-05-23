# Billing System

Mobile-first meat billing system with:

- a FastAPI backend for auth, shops, pricing, billing, receipts, audit logs, and item images
- an Expo React Native frontend for admin and shop operators
- Android Bluetooth and USB ESC/POS receipt printing
- a Caddy reverse proxy with automatic HTTPS

## Apps

- `backend/` - FastAPI API, database access, RustFS integration
- `frontend/` - Expo React Native app
- `caddy/` - reverse proxy, rate limiting, DuckDNS DNS-challenge TLS
- `rustfs/` - optional object storage container helpers
- `duckdns/` - local DuckDNS update script used for cron-based IP refresh

## Product Flow

1. Admin signs in.
2. Admin creates shop users.
3. Each shop sets daily prices.
4. Counter staff add items and checkout.
5. Backend accepts a sale only when payment totals match the bill.
6. Receipt printing runs through saved Bluetooth or USB printers on Android, with fallback printing on web and iOS.
7. Receipt data and audit logs are stored immediately.

## Tech Stack

- Backend: FastAPI, SQLAlchemy async, PostgreSQL, JWT auth, `uv`
- Frontend: Expo 54, React Native, TypeScript, Zustand, React Navigation, NativeWind
- Proxy: Caddy 2 with `caddy-ratelimit` and `caddy-dns/duckdns`
- Storage: RustFS / S3-compatible object storage

## Repository Layout

```text
.
├── backend/
├── frontend/
├── caddy/
├── rustfs/
├── duckdns/
├── compose.yaml
├── docker-compose.prod.yml
├── Makefile
└── README.md
```

## Prerequisites

- Python `3.11+`
- `uv`
- Node.js `18+`
- npm
- Docker and Docker Compose
- PostgreSQL if running backend outside Docker
- Android emulator, device, iOS simulator, or browser for the frontend

## Local Backend

```bash
cd backend
cp .env.example .env
uv sync
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Useful backend commands:

```bash
cd backend
uv sync --group dev
uv run ruff check .
uv run ruff format .
uv run --with pytest pytest ../test/ -v
```

## Local Frontend

```bash
cd frontend
npm install
npx expo start
```

For the Android dev client and printer workflow:

```bash
cd frontend
npx expo run:android
npm run start:dev
```

If the backend runs on the same machine and the frontend is on a physical Android phone:

```bash
adb reverse tcp:8000 tcp:8000
```

## Docker Stack

The active Docker stack is [`compose.yaml`](compose.yaml).

Services:

- `backend`
- `caddy`

The current Caddy stack publishes:

- `80:80`
- `443:443`
- `443:443/udp`

Start it with:

```bash
docker compose -f compose.yaml up -d --build --remove-orphans
```

Or use the Makefile:

```bash
make docker-up
make docker-logs
make docker-down
```

The Makefile also supports selecting a different compose file:

```bash
make docker-up COMPOSE_FILE=docker-compose.prod.yml
```

Note: `docker-compose.prod.yml` is currently a parked commented file, not the active deployment definition.

## HTTPS

The current Caddy config is in [`caddy/Caddyfile`](caddy/Caddyfile) and uses:

- reverse proxy to `backend:8000`
- edge rate limiting
- DuckDNS DNS challenge for automatic TLS

The Caddy image is built from [`caddy/Dockerfile`](caddy/Dockerfile) and includes:

- `github.com/mholt/caddy-ratelimit`
- `github.com/caddy-dns/duckdns`

Current public hostname:

- `pos-mlb.duckdns.org`

Current TLS mode:

- Let's Encrypt via `dns-01` challenge through DuckDNS

Required root `.env` values:

```env
CADDY_ACME_EMAIL=your-email@example.com
DUCKDNS_API_TOKEN=your-duckdns-token
CADDY_UPSTREAM=backend:8000
CADDY_RATE_LIMIT_EVENTS=120
CADDY_RATE_LIMIT_WINDOW=1m
```

Bring Caddy up or rebuild it after config changes:

```bash
docker compose -f compose.yaml up -d --build caddy
```

## DuckDNS

The repository includes [`duckdns/duck.sh`](duckdns/duck.sh), which updates the `pos-mlb` DuckDNS record.

The installed host-side script path is:

```text
/home/sachinn-p/duckdns/duck.sh
```

Typical cron entry:

```cron
*/5 * * * * /home/sachinn-p/duckdns/duck.sh >/dev/null 2>&1
```

Check the updater log with:

```bash
cat /home/sachinn-p/duckdns/duck.log
```

Important:

- if you hard-code the IP in the script, keep it aligned with your real public IP
- if your network auto-detection returns a private `10.x.x.x` address, do not use blank `ip=` mode

## DNS Notes

Public DNS and local DNS may differ.

Useful checks:

```bash
dig +short pos-mlb.duckdns.org @1.1.1.1
dig +short pos-mlb.duckdns.org @8.8.8.8
resolvectl query pos-mlb.duckdns.org
```

If public DNS is correct but this laptop still resolves the hostname to a stale private address, add a local hosts override:

```bash
echo '127.0.0.1 pos-mlb.duckdns.org' | sudo tee -a /etc/hosts
sudo resolvectl flush-caches
```

## API URLs

Direct backend:

- `http://127.0.0.1:8000`
- `http://127.0.0.1:8000/api/v1/health`
- `http://127.0.0.1:8000/docs`

Through Caddy:

- `https://pos-mlb.duckdns.org`
- `https://pos-mlb.duckdns.org/docs`
- `https://pos-mlb.duckdns.org/api/v1/health`

Internal Docker upstream:

- `http://backend:8000`

## Direct POS Printing

- Bluetooth and USB ESC/POS printing use `@haroldtran/react-native-thermal-printer`
- Expo Go cannot load the printer module
- use an Android dev build or release build for live printer testing
- web and iOS use print fallback behavior

## Testing

Backend tests:

```bash
cd backend
uv run --with pytest pytest ../test/ -v
```

Coverage:

```bash
cd backend
uv run --with pytest --with pytest-cov pytest ../test/ --cov=app --cov-report=html
```

## Helpful Commands

```bash
make docker-config
make docker-up
make docker-logs
make docker-down
make frontend-typecheck
make backend-test
```

## App Documentation

- Backend notes: [backend/README.md](backend/README.md)
- Frontend notes: [frontend/README.md](frontend/README.md)
