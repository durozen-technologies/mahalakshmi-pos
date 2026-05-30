# Billing System Agent Guide

## Scope

This file applies to the whole repository.

## Project Shape

- `backend/`: FastAPI, SQLAlchemy async, PostgreSQL, Alembic, RustFS/S3-compatible item images.
- `frontend/`: Expo React Native, TypeScript, Zustand, NativeWind, Android receipt printing.
- `WhatsApp Bot/`: FastAPI WhatsApp bot that reuses backend domain models and schemas.
- `test/`: backend unit and integration tests.

## Non-Negotiable Business Rules

- Receipt data must be saved only after printing succeeds. Keep the preview/print/commit flow intact.
- Item images must not be stored in Postgres. Store/read images through RustFS using `image_object_key` and `image_content_type`.
- Do not reintroduce `items.image_data` into active models or application reads/writes. It is legacy-only migration code.
- Tamil item names are first-class item data. Preserve `tamil_name` / `item_tamil_name` through backend schemas, APIs, cart state, receipt output, and frontend language selection.
- Admin item create/update must require valid Tamil names, not whitespace-only values.

## Backend Rules

- Schema changes must use Alembic revisions under `backend/migrations/versions/`.
- Keep `backend/migrate.py` as the single application migration command: it runs legacy image migration, Alembic, then idempotent startup data tasks.
- Do not use `Base.metadata.create_all()` as the production schema migration path.
- If touching DB startup or migrations, verify both fresh DB behavior and legacy-column behavior when relevant.
- Production requires RustFS for item images; image upload should fail instead of falling back to Postgres.

## Frontend Rules

- Checkout must call bill preview first, print the preview, and commit with `checkout_token` only after print succeeds.
- Tamil display should use `item_tamil_name` when selected language is Tamil; English should use `item_name`.
- Keep receipt rendering, cart state, direct printer paths, and admin/shop screens type-safe.

## Validation Commands

Run focused checks for touched areas first, then broader checks when done:

```bash
backend/.venv/bin/python -m ruff check backend/app backend/migrate.py backend/migrations test
backend/.venv/bin/python -m unittest discover test
npm --prefix frontend run typecheck
```

For migration work, also run:

```bash
DATABASE_URL=sqlite:////tmp/billing_alembic_check.sqlite3 backend/.venv/bin/python -m alembic -c backend/alembic.ini upgrade head
DATABASE_URL=sqlite:////tmp/billing_alembic_check.sqlite3 backend/.venv/bin/python -m alembic -c backend/alembic.ini current
```

For lockfile/dependency changes in `backend/`, run from `backend/`:

```bash
uv lock --check
```

## Working Style

- Keep changes surgical and consistent with nearby code.
- Do not revert unrelated dirty files.
- Prefer `rg` for search.
- Use `apply_patch` for edits.
- Reference changed files with line numbers in final summaries.
