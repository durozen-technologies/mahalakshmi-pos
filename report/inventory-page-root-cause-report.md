# Inventory Page Performance Root-Cause Report

Generated: 2026-06-05

## Summary

The current inventory performance issue is no longer primarily the admin item list itself. The admin item list now has a row-first API and a `FlatList`, but both inventory experiences still pull expensive full stock-summary data through backend paths that scale with inventory size and movement history.

The biggest remaining root causes are:

1. Admin inventory eagerly loads branch stock summary even when the user is on the item list tab.
2. Admin branch stock renders all summary rows in a `ScrollView`.
3. Shop inventory loads a full stock summary on every focus and renders all items in a `ScrollView`.
4. Backend stock summaries recalculate totals by aggregating movement history for all loaded items.
5. Admin item pagination is partially undermined by concurrent full-summary requests and exact count queries.

## Confirmed Root Causes

### 1. Admin inventory fetches full branch stock outside the branch stock tab

Severity: Critical

Evidence:

- `frontend/src/screens/admin/admin-inventory-screen.tsx:265` loads base data and then calls `loadInventoryRows()`.
- `frontend/src/screens/admin/admin-inventory-screen.tsx:301` defines `loadShopData()`, which calls `fetchShopInventoryAllocations(shopId)`.
- `frontend/src/screens/admin/admin-inventory-screen.tsx:375` runs `loadShopData(selectedShopId)` whenever a shop and base data exist.
- That effect is not gated by `activeTab`, so the expensive branch inventory request can run while the user is only viewing paginated inventory items.
- `backend/app/routers/admin.py:683` exposes `GET /shops/{shop_id}/inventory-allocations`.
- `backend/app/routers/admin.py:689` returns `get_inventory_summary(db, shop, include_unallocated=True)`.

Impact:

- The row-first admin inventory item API is partly neutralized because the screen can still trigger a full stock-summary fetch in parallel.
- For large catalogs, this creates avoidable backend load, network payload size, JSON parsing cost, and frontend state pressure.
- The user can experience item-page slowness even though the visible item list is paginated.

Recommended fix:

- Only call `loadShopData()` when the shop stock tab is active.
- Keep the items tab limited to `fetchInventoryItemRows()` and `fetchInventoryItemCounts()`.
- Cache branch stock per selected shop if the tab is reopened without relevant mutations.

### 2. Admin branch stock renders every stock row in a `ScrollView`

Severity: High

Evidence:

- `frontend/src/screens/admin/admin-inventory-screen.tsx:660` defines `renderShopStock()`.
- `frontend/src/screens/admin/admin-inventory-screen.tsx:735` renders `(summary?.items ?? []).map(...)`.
- The screen body later uses a `ScrollView` for non-item tabs.

Impact:

- React Native renders every stock row at once.
- Thumbnail components, text layout, switches, and stock controls are created for the entire inventory instead of the visible viewport.
- This increases time to interactive, memory usage, and JS thread work.

Recommended fix:

- Replace the branch stock row rendering with `FlatList`.
- Pair it with a paged branch stock API so the frontend never receives or renders the full catalog for this tab.

### 3. Shop inventory fetches a full summary on every focus and renders every item

Severity: High

Evidence:

- `frontend/src/screens/shop/inventory-management-screen.tsx:160` defines `loadInventory()`.
- `frontend/src/screens/shop/inventory-management-screen.tsx:168` calls `fetchShopInventory()`.
- `frontend/src/screens/shop/inventory-management-screen.tsx:205` calls `loadInventory()` in `useFocusEffect()`.
- `frontend/src/screens/shop/inventory-management-screen.tsx:353` sorts all `summary.items`.
- `frontend/src/screens/shop/inventory-management-screen.tsx:376` renders a `ScrollView`.
- `frontend/src/screens/shop/inventory-management-screen.tsx:400` renders `sortedItems.map(...)`.
- `backend/app/routers/shop.py:88` exposes shop inventory.
- `backend/app/routers/shop.py:93` returns `get_inventory_summary(db, shop, active_allocations_only=True)`.

Impact:

- Every screen focus can require a full backend stock-summary calculation.
- The frontend sorts and renders the entire active allocation list before the user can interact smoothly.
- This creates UI jank for shops with many active inventory items.

Recommended fix:

- Add a row-first shop inventory API, for example `GET /api/v1/shop/inventory/items/rows`.
- Use `FlatList` with cursor pagination in the shop inventory screen.
- Keep the existing full `/shop/inventory` endpoint for compatibility until no screen depends on it.

### 4. Backend summary generation scales with inventory size and movement history

Severity: High

Evidence:

- `backend/app/services/inventory.py:814` defines `get_inventory_summary()`.
- `backend/app/services/inventory.py:821` loads all shop allocations.
- `backend/app/services/inventory.py:845` leaves the item query unrestricted when `include_unallocated=True`.
- `backend/app/services/inventory.py:852` loads all matching inventory items with category links.
- `backend/app/services/inventory.py:858` calls `_movement_totals(db, shop.id, item_ids)`.
- `backend/app/services/inventory.py:732` defines `_movement_totals()`.
- `backend/app/services/inventory.py:739` aggregates movement totals by item and movement type.
- `backend/app/services/inventory.py:761` separately aggregates used quantities by item and category.
- `backend/app/services/inventory.py:859` builds `InventoryItemStockRead` for every loaded item.
- `backend/app/services/inventory.py:878` then recomputes category totals in Python.

Impact:

- Summary response time grows with both catalog size and movement ledger size.
- The admin allocation endpoint is worst because `include_unallocated=True` loads the full inventory catalog.
- Indexes reduce scan cost, but the endpoint still performs repeated aggregation work for every full summary request.

Recommended fix:

- Introduce paged stock/allocation row endpoints that aggregate totals only for the current page.
- If paged aggregation remains slow, add a persisted stock balance table updated during add/use/split/allocation mutations.
- Keep movement history as the audit log, but avoid using it as the hot-path stock balance source for every page render.

### 5. Admin item pagination still pays avoidable companion costs

Severity: Medium

Evidence:

- `frontend/src/screens/admin/admin-inventory-screen.tsx:175` defines the paged `loadInventoryRows()` flow.
- `frontend/src/screens/admin/admin-inventory-screen.tsx:210` fetches item rows and counts in parallel.
- `frontend/src/screens/admin/admin-inventory-screen.tsx:214` fetches exact item counts on non-append loads.
- The same screen can still trigger `loadShopData()` from the separate effect at `frontend/src/screens/admin/admin-inventory-screen.tsx:375`.

Impact:

- Exact counts may become expensive during broad search.
- Even when row pagination is working, the concurrent full-summary effect can dominate perceived performance.

Recommended fix:

- Defer or lazily refresh exact counts when search text changes.
- Do not block visible row display on counts.
- Remove the full branch-summary side request from the item tab.

## Recommended Implementation Order

1. Gate admin branch stock loading by active tab.
   - Only fetch `/admin/shops/{shop_id}/inventory-allocations` when the shop stock tab opens.
   - This is the smallest change with the largest immediate impact on the admin item page.

2. Add paged stock row APIs.
   - Admin: `GET /api/v1/admin/shops/{shop_id}/inventory-allocations/rows`.
   - Shop: `GET /api/v1/shop/inventory/items/rows`.
   - Use cursor fields that match the existing item-row pattern: sort order, name, and id.
   - Return compact `InventoryItemStockRead` rows for the current page.

3. Virtualize stock screens.
   - Use `FlatList` for admin branch stock rows.
   - Use `FlatList` for shop inventory rows.
   - Fetch more rows on scroll.

4. Narrow admin allocation mutation responses.
   - Change the admin allocation update path to return the changed stock/allocation row.
   - Patch the frontend row locally after active/sort-order changes.
   - Full-refresh only when a conflict, inactive item, missing allocation, or stale-state error occurs.

5. Revisit backend stock storage if needed.
   - If page-level aggregation is still too slow under production data, add a stock balance table or materialized balance projection.
   - Update balances in the same transaction as movement creation.

## Validation Plan

Backend:

- Add tests for admin stock row pagination, search, active allocation filters, unallocated item inclusion, and stable cursors.
- Add tests for shop stock row pagination and active allocation filtering.
- Add tests proving allocation update can return the changed row without rebuilding a full summary.
- Keep compatibility tests for the existing full summary endpoints.

Frontend:

- Verify the admin item tab does not request `/inventory-allocations`.
- Verify opening the admin shop stock tab loads only the first page of stock rows.
- Verify shop inventory loads paged rows and renders through `FlatList`.
- Verify add/use/split mutations patch the visible row without a full summary response.
- Verify movement history is still lazy-loaded only when opened.

Commands:

```bash
cd backend && uv run ruff check . && uv run --with pytest pytest ../test/
cd frontend && npm run typecheck
```

## Current Status Of Previous Optimizations

Already improved:

- Admin item browsing has row-first APIs and `FlatList` rendering.
- Movement history defaults to lazy loading with 30 rows.
- Shop stock mutations can return changed item data without a full summary by default.
- Image proxy streaming work is separate from this inventory page bottleneck.

Still problematic:

- Full stock summaries remain on hot inventory navigation paths.
- Admin and shop stock views still render full item arrays.
- Backend stock summary calculation still aggregates movement history for every loaded summary item.

## Assumptions

- This report is additive and does not replace `report/performance-optimization-report.md`.
- Checkout behavior remains `preview -> print -> commit`.
- Item images remain RustFS-backed and are not moved back into Postgres.
- Tamil item names remain required.
- Exact payment validation remains unchanged.
- Existing full inventory endpoints remain available while row-first stock APIs are introduced.
