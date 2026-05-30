# Database migrations

Alembic owns schema changes for the backend.

Common commands from `backend/`:

```bash
uv run alembic upgrade head
uv run alembic revision -m "describe change"
```

Use `uv run python migrate.py` for the application migration command. It runs
Alembic schema migrations first, then idempotent data/startup tasks such as
legacy image migration to RustFS.
