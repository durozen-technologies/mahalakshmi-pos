# Performance and API Optimization Audit Report

Audit date: 2026-06-05

Scope: backend FastAPI routers/services/database/storage code, frontend API wrappers, API handling hooks, Zustand-facing data flows, and the major shop/admin screens that load API data.

Method: static code inspection with route and API-wrapper mapping. No local production database or representative traffic profile was available, so query-cost conclusions are marked as either confirmed-by-code or needs-profiling.

Business rules preserved in all recommendations:

- Checkout must remain `preview -> print -> commit`; database writes must stay after successful printing.
- Item images must stay RustFS/S3-backed through object keys, not Postgres bytes.
- `tamil_name` remains first-class and required in admin item updates.
- Cash plus UPI must exactly match the bill total.

## Executive Summary

### Critical

No confirmed critical performance defect was found from static inspection. The checkout business flow is correctly designed around preview tokens and post-print commit, and no recommendation should weaken that.

### High

1. Admin print-all and bill preview can trigger an API N+1 pattern. The dashboard loads bill summaries, then fetches full bill details one at a time through `/api/v1/admin/bills/{bill_id}`. Print-all chunks those requests with `Promise.all`, so printing 50 visible bills can become 50 detail requests. Evidence: `frontend/src/screens/admin/admin-dashboard-screen.tsx:641`, `frontend/src/screens/admin/hooks/use-admin-dashboard-data.ts:325`, `backend/app/services/admin.py:2723`.
2. Shop inventory stock mutations return a full inventory summary after every add/use operation. This is convenient for UI refresh but expensive as inventory item, category, allocation, and movement data grows. Evidence: `backend/app/services/inventory.py:982`, `backend/app/services/inventory.py:1030`, `backend/app/services/inventory.py:1102`.
3. Admin inventory item listing is unpaginated. The frontend fetches all inventory items on load and search, and the backend returns a full list plus category rows for all matched items. Evidence: `frontend/src/screens/admin/admin-inventory-screen.tsx:128`, `frontend/src/screens/admin/admin-inventory-screen.tsx:193`, `backend/app/services/inventory.py:330`.
4. Image proxying reads entire RustFS objects into backend memory before responding. This is acceptable for thumbnails and capped images today, but it is still a per-request memory and latency risk if public RustFS reads are disabled or image volume rises. Evidence: `backend/app/db/storage.py:776`.

### Medium

1. Search filters use `lower(column) LIKE '%term%'` in admin and inventory services. This is flexible but difficult for ordinary B-tree indexes to accelerate. Evidence: `backend/app/services/admin.py:467`, `backend/app/services/admin.py:1029`, `backend/app/services/admin.py:1320`, `backend/app/services/inventory.py:350`.
2. Frontend host probing and failover are robust but can add health-check latency and repeated retries on expensive paths. Evidence: `frontend/src/api/client.ts:392`, `frontend/src/api/client.ts:442`, `frontend/src/api/client.ts:569`, `frontend/src/api/client.ts:635`.
3. Dashboard analytics has been improved into a bootstrap endpoint, but large bill/payment datasets still need `EXPLAIN ANALYZE` validation, especially for date ranges and largest-bill sorting. Evidence: `backend/app/services/admin.py:3100`, `backend/app/services/admin.py:3164`.
4. Shop billing bootstrap loads the entire billable catalogue and latest price snapshot in one response. That is good for offline-like POS speed when item counts are modest, but it should be watched if catalogues become large. Evidence: `backend/app/services/pricing.py:236`.

### Low

1. `SelectiveGZipMiddleware` only compresses single-body responses and bypasses streamed/multipart bodies. That is a reasonable implementation, but large JSON payloads should be checked to ensure they stay single-body and compress as expected. Evidence: `backend/app/core/middleware.py:90`.
2. Request ID and slow-route logging exist, but tracked route coverage is narrow and excludes analytics, inventory mutation, and bill detail endpoints. Evidence: `backend/app/core/middleware.py:36`.
3. Frontend image prefetch is intentionally capped at 12 items, which is healthy, but category switching may still create thumbnail bursts if the first visible set changes often. Evidence: `frontend/src/utils/item-images.ts:15`.

## Backend Findings

### 1. Admin Bill Detail N+1

Severity: High

Finding: Dashboard bill lists return summaries, while previews and print-all fetch full bills one ID at a time. The backend single-bill query is optimized internally with joins and `selectinload`, but the API shape still multiplies network round trips.

Evidence:

- Detail endpoint service: `backend/app/services/admin.py:2723`
- Frontend cache/request dedupe: `frontend/src/screens/admin/hooks/use-admin-dashboard-data.ts:325`
- Print-all concurrent chunk: `frontend/src/screens/admin/admin-dashboard-screen.tsx:641`

Impact:

- Print-all can issue up to one request per visible bill.
- Mobile networks and reverse proxy rate limits can turn this into visible delay.
- A single slow bill detail request delays the full print batch.

Recommendation:

- Add a batch endpoint such as `POST /api/v1/admin/bills/details` with `bill_ids: UUID[]`, capped at a safe batch size such as 50.
- Reuse the current `get_bill_by_id` loading strategy, but fetch all requested bills with one query for bills and one select-in query for items.
- Preserve current single-bill endpoint for preview and compatibility.
- In the frontend, make `handlePrintAllBills` call the batch endpoint for missing cache entries, then hydrate the existing detail cache.

Validation:

- Unit test ordering and missing-ID behavior.
- Integration test for 1, 10, and max batch size.
- Compare current 50-request print-all against one batch request with network timing.

### 2. Full Inventory Summary Returned After Every Stock Mutation

Severity: High

Finding: `add_shop_inventory_stock`, `use_shop_inventory_stock`, and `use_shop_inventory_stock_split` commit movements, reload movement rows, then call `get_inventory_summary` for the whole shop. `get_inventory_summary` loads allocations, inventory items with category links, movement totals, and category totals.

Evidence:

- Summary builder: `backend/app/services/inventory.py:700`
- Add stock response: `backend/app/services/inventory.py:956`
- Use stock response: `backend/app/services/inventory.py:991`
- Use split response: `backend/app/services/inventory.py:1039`
- Shop screen consumes full summary: `frontend/src/screens/shop/inventory-management-screen.tsx:224`

Impact:

- One small stock movement scales with the whole shop inventory.
- Hot checkout-adjacent inventory use can compete with billing API latency.
- Bigger shops will pay repeated aggregation cost even when only one item changed.

Recommendation:

- Introduce an optional narrow mutation response: changed movement(s), changed item stock, and summary version/timestamp.
- Keep a `?include_summary=true` compatibility option or continue the old response until frontend migration is complete.
- Add a focused backend helper that computes stock only for the changed item using `_movement_totals(db, shop.id, [item_id])`.
- Frontend should patch the changed item locally and refresh full summary only on screen focus, pull-to-refresh, or conflict recovery.

Validation:

- Integration tests for old and narrow response modes.
- Benchmark add/use with 10, 100, and 1000 inventory items.
- Confirm conflict errors still trigger full refresh in the app.

### 3. Admin Inventory Items Are Unpaginated

Severity: High

Finding: Admin inventory uses `fetchInventoryItems()` on screen load and debounced search. The backend `list_inventory_items` returns every matching item and then performs a second query for categories for the full ID set.

Evidence:

- Frontend base load: `frontend/src/screens/admin/admin-inventory-screen.tsx:119`
- Frontend search reload: `frontend/src/screens/admin/admin-inventory-screen.tsx:188`
- Backend list query: `backend/app/services/inventory.py:330`

Impact:

- Large inventory catalogues will increase initial load time, memory, render cost, and search latency.
- The second category query has an expanding `IN (...)` list.
- The frontend screen uses `ScrollView` for this admin inventory page, so it is more sensitive to large arrays than virtualized pages.

Recommendation:

- Add row-first cursor pagination for inventory items, matching the stronger admin item pattern:
  - `GET /api/v1/admin/inventory/items/rows`
  - `GET /api/v1/admin/inventory/items/counts`
- Return compact rows for list cards and keep `GET /inventory/items/{item_id}` for full editor detail.
- Move admin inventory screen to a virtualized list for item rows.
- Keep category and shops fetches separate and cached because they are smaller reference data.

Validation:

- Tests for cursor stability by `sort_order`, lower name, and ID.
- Typecheck the frontend row/count hook.
- Manual check with seeded large inventory data.

### 4. Search Uses Lowercase Contains Matching

Severity: Medium

Finding: Search paths use `lower(column).like('%term%')` across item names, Tamil names, and allocation display names.

Evidence:

- Shop item search: `backend/app/services/admin.py:467`
- Selected shop source search: `backend/app/services/admin.py:1029`
- Import candidate/catalogue search: `backend/app/services/admin.py:1320`
- Inventory item search: `backend/app/services/inventory.py:350`

Impact:

- Leading wildcard searches cannot use normal B-tree indexes effectively.
- Functional lower-name indexes help ordering/exact/prefix patterns but not broad contains search.
- Tamil names are part of the search surface, so performance work must preserve multilingual matching.

Recommendation:

- If PostgreSQL is the production target, add `pg_trgm` indexes for `lower(name)`, `lower(tamil_name)`, and high-use allocation display fields.
- For smaller deployments, enforce a minimum search length of 2 or 3 characters in frontend requests.
- Consider normalized search columns only if trigram is unavailable.

Validation:

- Compare `EXPLAIN ANALYZE` before/after for item, selected item, import candidate, and inventory item searches.
- Test English and Tamil search terms.

### 5. RustFS Image Proxy Reads Whole Objects

Severity: High

Finding: `_download_object` calls `body.read()` and stores the whole image payload in memory before FastAPI returns a `Response`. Thumbnail generation also downloads the original object when the thumbnail is missing.

Evidence:

- Full object read: `backend/app/db/storage.py:776`
- Lazy thumbnail path: `backend/app/db/storage.py:869`
- Public URL support exists but is off by default: `backend/app/core/config.py:59`

Impact:

- Backend memory and latency scale with concurrent image requests.
- Lazy thumbnail creation on a user image request can block the request with RustFS download, PIL resize, RustFS upload, and DB commit.
- If `RUSTFS_PUBLIC_READ_ENABLED` is false in production, all item images pass through the API container.

Recommendation:

- Prefer public RustFS reads or signed URLs for image display where deployment allows it.
- If proxying remains required, use `StreamingResponse` or a file-like iterator from the S3 body.
- Backfill thumbnails during startup or a scheduled admin task instead of lazily on customer-facing requests.
- Keep strict image max size and thumbnail generation; do not reintroduce image bytes into Postgres.

Validation:

- Load test catalog image grids with proxy mode and public-read mode.
- Check memory under concurrent image requests.
- Verify `ETag`/`Cache-Control` behavior remains correct.

### 6. Analytics Queries Need Data-Scale EXPLAIN

Severity: Medium

Finding: Dashboard bootstrap avoids several duplicate queries and skips expensive work when no bills exist, which is good. However, the combined shop/payment aggregation, largest-bill query, bill page, and item-sales query still need database-plan validation on realistic bill volumes.

Evidence:

- Combined dashboard aggregation: `backend/app/services/admin.py:3100`
- Largest bill query: `backend/app/services/admin.py:3164`
- Bill paging query: `backend/app/services/admin.py:2910`
- Item sales aggregation: `backend/app/services/admin.py:3036`

Impact:

- Date range dashboards can become slow when `bills`, `payments`, and `bill_items` grow.
- Largest-bill ordering by total amount may need a better compound index for period filters plus amount ordering.

Recommendation:

- Capture `EXPLAIN (ANALYZE, BUFFERS)` for dashboard periods: date, week, month, year, and custom range.
- Add or tune compound indexes only from observed plans.
- Consider materialized daily shop/item aggregates only after query/index tuning is insufficient.

Validation:

- Seed or anonymize production-like bill history.
- Record p50/p95 dashboard bootstrap latency before and after index changes.

### 7. DB Pool and Worker Sizing Should Be Documented Per Deployment

Severity: Medium

Finding: SQLAlchemy uses `pool_size=5`, `max_overflow=10`, and `pool_pre_ping=True`; compose defaults backend `WEB_CONCURRENCY` to 1 in the active configuration shown by the user. With multiple workers, total possible connections scale by worker count.

Evidence:

- Pool config: `backend/app/db/database.py:53`
- Defaults: `backend/app/core/config.py:50`

Impact:

- Too few connections bottleneck concurrent admin/image/report requests.
- Too many workers or overflow connections can exhaust Postgres.

Recommendation:

- Document connection budget: `workers * (pool_size + max_overflow)`.
- Separate image/public serving from API DB pool where possible.
- Add deployment guidance for low-end VPS vs production Postgres.

Validation:

- Run a small concurrent API load test with shop bootstrap, dashboard bootstrap, inventory summary, and image requests.

### 8. Gzip and Slow Logging Are Helpful But Narrow

Severity: Low

Finding: Custom gzip avoids images and compresses single-body JSON responses over 1024 bytes. Slow route logging focuses on selected admin item/image routes, not all heavy routes.

Evidence:

- Middleware install: `backend/app/main.py:79`
- Slow route matcher: `backend/app/core/middleware.py:36`
- Gzip responder: `backend/app/core/middleware.py:90`

Impact:

- Heavy analytics, inventory mutation, and bill detail routes can be slow without targeted logs.
- Streaming responses are not compressed by this custom middleware, which is acceptable but worth documenting.

Recommendation:

- Expand slow-route tracking to dashboard bootstrap, bill detail, inventory summary/mutations, and image routes for both item types.
- Add latency fields to access logs or metrics if available.

Validation:

- Force slow requests in development and confirm request ID, path, status, and elapsed time are logged.

## Frontend Findings

### 1. API Client Failover Can Add Latency

Severity: Medium

Finding: The Axios client resolves a reachable base URL through health probes, persists the winner, applies path-specific timeouts, and retries failed network requests against fallback URLs. This is robust for Expo/device networking, but it can add latency before real requests and can retry expensive requests after a timeout.

Evidence:

- Health probe: `frontend/src/api/client.ts:392`
- Race for first reachable base URL: `frontend/src/api/client.ts:422`
- Request interceptor: `frontend/src/api/client.ts:569`
- Retry/fallback handling: `frontend/src/api/client.ts:635`

Impact:

- First request after cold start may wait for probes.
- If a slow backend route times out at the client, the retry may duplicate backend load unless the first request was truly not accepted.
- Short admin count timeouts can make slow count queries feel flaky instead of visibly slow.

Recommendation:

- Log or surface when a request used a fallback or retry path.
- Consider disabling automatic retry for non-idempotent methods except network failures before request send.
- Keep upload direct path behavior, because Expo file upload uses a separate API.
- Document timeout budgets by endpoint family.

Validation:

- Simulate unreachable primary URL and slow secondary URL.
- Confirm POST retries do not duplicate state-changing work.

### 2. Admin Dashboard Print-All N+1

Severity: High

Finding: The frontend detail cache deduplicates repeated bill requests, but print-all still loads all missing details one request per bill.

Evidence:

- Detail cache: `frontend/src/screens/admin/hooks/use-admin-dashboard-data.ts:325`
- Print-all loop: `frontend/src/screens/admin/admin-dashboard-screen.tsx:655`

Impact:

- Large print jobs become network-bound.
- Request bursts can hit mobile network limits and reverse-proxy rate limits.

Recommendation:

- Add batch detail API and update print-all to hydrate missing bill details in one request per chunk.
- Keep single preview using the current endpoint unless batch support naturally replaces it.

Validation:

- Compare API request count for printing 1, 10, 50 bills.

### 3. Admin Inventory Screen Pulls Too Much Data

Severity: High

Finding: Admin inventory loads categories, all inventory items, and shops in parallel. It then separately loads selected shop inventory summary and 100 movements. Search repeats the all-items request.

Evidence:

- Base load: `frontend/src/screens/admin/admin-inventory-screen.tsx:119`
- Search fetch: `frontend/src/screens/admin/admin-inventory-screen.tsx:188`
- Shop data load: `frontend/src/screens/admin/admin-inventory-screen.tsx:157`

Impact:

- Large item lists increase JS memory and render cost.
- Search creates repeated full-result payloads.
- The screen uses `ScrollView` around the page body, so large lists can become janky.

Recommendation:

- Introduce paginated inventory item API and a row-first hook.
- Use `FlatList` for item rows.
- Cache categories and shops across focus events unless an edit/create/delete invalidates them.

Validation:

- Typecheck and inspect renders with 500+ inventory items.

### 4. Shop Inventory Screen Loads Full Summary and 100 Movements on Focus

Severity: Medium

Finding: The shop inventory screen loads full shop inventory and 100 movements on every focus. Mutations then accept a full replacement summary from the backend.

Evidence:

- Focus load: `frontend/src/screens/shop/inventory-management-screen.tsx:117`
- Mutation response consumption: `frontend/src/screens/shop/inventory-management-screen.tsx:224`

Impact:

- Re-entering the screen creates predictable API load.
- The 100-movement fetch is independent of whether history is opened.

Recommendation:

- Load movement history lazily when the history UI opens, or fetch a smaller default such as 20.
- Patch changed stock item locally after mutations, then background-refresh full summary.

Validation:

- Confirm history UI still shows fresh data after opening and after stock mutation.

### 5. Item Thumbnail Prefetch Is Safe But Basic

Severity: Low

Finding: Thumbnail prefetch is capped at 12 unique URLs, which prevents runaway preloads. It does not account for currently selected catalogue/category beyond caller ordering.

Evidence:

- Prefetch cap: `frontend/src/utils/item-images.ts:15`

Impact:

- First category loads feel good, but later category switches may still fetch visible thumbnails on demand.

Recommendation:

- Keep the cap.
- Optionally prefetch the first visible items of the selected category after category change.
- Prefer RustFS public URLs or CDN-cacheable URLs where possible.

Validation:

- Inspect network/image cache behavior while switching categories.

### 6. Admin Item Management Has Good Patterns Worth Reusing

Severity: Positive finding

Finding: Admin item management already has row-first endpoints, separate count endpoints, abort controllers, cursor pagination, request ID guards, and debounced counts. This is the best local pattern for future list-heavy work.

Evidence:

- Row/count API wrappers: `frontend/src/api/admin.ts:304`, `frontend/src/api/admin.ts:316`, `frontend/src/api/admin.ts:397`, `frontend/src/api/admin.ts:408`
- Row-first hook: `frontend/src/screens/admin/hooks/use-admin-items-data.ts:71`
- Backend selected item rows/counts: `backend/app/services/admin.py:1050`

Recommendation:

- Use this as the template for admin inventory item pagination and future large reference-data screens.

## API Coverage and Handling Map

| API group | Backend routes | Frontend callers | Current behavior | Risk | Recommendation |
|---|---|---|---|---|---|
| Health | `GET /api/v1/health` | API client probes | Used for base URL selection | Low | Keep; log probe failures in dev diagnostics |
| Auth | `/auth/login`, `/auth/register`, `/auth/reset-password`, `/auth/me` | `frontend/src/api/auth.ts` | Normal JSON requests, 401 clears stores | Low | Keep; avoid retrying login across many fallbacks if credentials are wrong |
| Shop bootstrap/prices | `/shop/bootstrap`, `/shop/daily-prices/today`, `/shop/daily-prices` | `frontend/src/api/prices.ts`, `use-shop-bootstrap` | One bootstrap hydrates shop billing catalogue/prices | Medium | Watch payload size; consider incremental price refresh only if catalogues grow |
| Checkout | `/shop/bills/preview`, `/shop/bills` | `frontend/src/api/billing.ts`, checkout screen | Correct preview-token-commit flow | Low | Preserve business rule; do not merge preview and commit |
| Shop inventory | `/shop/inventory`, `/shop/inventory/movements`, stock mutation endpoints | `frontend/src/api/inventory.ts`, shop inventory screen | Full summary plus movements on focus; mutations return full summary | High | Narrow mutation response and lazy movement history |
| Catalog images | `/catalog/items/{id}/image`, `/catalog/inventory-items/{id}/image` | item thumbnails through resolved URLs | Backend proxies RustFS unless public read enabled | High | Prefer public/signed URLs or streaming proxy |
| Admin shops/categories | `/admin/shops`, item categories, inventory categories | `frontend/src/api/admin.ts`, dashboard/inventory screens | Small reference data lists | Low | Cache across focus where useful |
| Admin item management | `/admin/items/rows`, `/admin/items/counts`, selected/import rows/counts | admin item hooks/screens | Cursor pagination and separate counts | Low | Reuse pattern elsewhere |
| Admin inventory items | `/admin/inventory/items`, `/admin/inventory/items/{id}` plus metadata/image endpoints | admin inventory and editor screens | Full list for load/search | High | Add rows/counts cursor pagination |
| Admin inventory allocations | `/admin/shops/{id}/inventory-allocations`, `/admin/inventory/summary`, `/admin/inventory/movements` | admin inventory screen | Full summary and movement list per selected shop | Medium | Paginate/lazy-load history; narrow allocation updates |
| Admin billing analytics | `/admin/dashboard/bootstrap`, `/admin/bills`, `/admin/bills/{id}`, sales/payment/item summaries | dashboard data hook | Bootstrap is consolidated; detail is one bill per request | High | Batch bill detail and EXPLAIN dashboard queries |
| Admin prices | `/admin/prices/bootstrap`, `/admin/shops/{id}/prices/bootstrap`, daily price saves | admin price screens/hooks | Full price bootstrap per shop | Medium | Keep for modest catalogue; evaluate row-based price editor for large catalogues |
| Admin uploads | item and inventory image create/update/delete endpoints | `FileSystem.uploadAsync` and Axios FormData wrappers | Uses direct file upload paths with long timeout | Medium | Keep direct upload; validate retry behavior and RustFS latency |

## Prioritized Action Plan

| Priority | Recommendation | Impact | Effort | Validation |
|---|---|---:|---:|---|
| P1 | Add admin batch bill detail endpoint and update print-all to use it | High | Medium | Request-count comparison and integration tests |
| P1 | Add narrow inventory mutation response mode | High | Medium | Mutation tests and inventory load benchmark |
| P1 | Paginate admin inventory items with row/count endpoints | High | Medium | Cursor tests and frontend typecheck |
| P2 | Add EXPLAIN-based analytics/index review | Medium | Medium | `EXPLAIN ANALYZE` on seeded data |
| P2 | Add trigram or equivalent search indexes for contains search | Medium | Medium | Search benchmarks in English and Tamil |
| P2 | Move image display to public/signed RustFS URLs or streaming proxy | High | Medium | Concurrent image load and memory test |
| P3 | Expand slow-route logging coverage | Medium | Low | Forced slow request log check |
| P3 | Lazy-load inventory movement history | Medium | Low | UI manual flow and typecheck |
| P3 | Document API timeout/failover policy | Medium | Low | Failure-mode test on unreachable primary URL |

## Suggested Profiling Checklist

Backend:

- Run `EXPLAIN (ANALYZE, BUFFERS)` for:
  - `/api/v1/admin/dashboard/bootstrap`
  - `/api/v1/admin/bills`
  - `/api/v1/admin/item-sales`
  - `/api/v1/shop/bootstrap`
  - `/api/v1/shop/inventory`
  - `/api/v1/admin/inventory/items?q=...`
- Measure p50/p95 latency for:
  - Shop billing bootstrap
  - Checkout preview
  - Checkout commit
  - Inventory add/use
  - Dashboard bootstrap
  - Bill detail and proposed bill batch detail
- Track response size for:
  - Shop bootstrap
  - Admin price bootstrap
  - Inventory summary
  - Dashboard bootstrap

Frontend:

- Count network requests for:
  - Admin dashboard initial load
  - Bill preview
  - Print all visible bills
  - Admin inventory load and search
  - Shop inventory focus and stock mutation
- Inspect JS render behavior for:
  - Admin inventory screen with 500+ items
  - Billing catalogue with many categories
  - Admin item management infinite scroll
- Verify fallback behavior for:
  - Primary URL offline
  - Backend healthy but slow
  - Upload endpoint unavailable

## Validation Commands

The report was built from static route/API inspection. The requested validation commands should be run after the report is created:

```bash
cd backend && uv run ruff check . && uv run --with pytest pytest ../test/
cd frontend && npm run typecheck
```

Do not run formatters, migrations, or code generators as part of this report-only task.

## Notes On Existing Strengths

- Checkout preview/commit is designed to preserve the print-before-commit rule with signed checkout tokens.
- Images are RustFS-object-key based and do not reintroduce Postgres image bytes.
- Admin item management already has row-first and count-split APIs, which should be reused.
- Several backend service queries already use narrow projections, cursor pagination, explicit eager loading, and supporting indexes.
- Frontend API handling includes request cancellation, request ID propagation in errors, base URL failover, and upload-specific behavior.

