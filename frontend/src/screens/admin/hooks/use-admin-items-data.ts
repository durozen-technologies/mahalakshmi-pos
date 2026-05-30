import { useCallback, useEffect, useRef, useState } from "react";

import {
  allocateShopItem,
  deallocateShopItem,
  deleteItem,
  deleteShopItem,
  fetchCatalogueItemsPage,
  fetchShopItemsPage,
  fetchShopPriceBootstrap,
  fetchShops,
  saveEditedShopDailyPrices,
  saveShopDailyPrice,
  saveShopDailyPrices,
  type FetchShopItemsParams,
} from "@/api/admin";
import { toApiError } from "@/api/client";
import { ItemScope, type DailyPriceCreate } from "@/types/api";
import type {
  ShopBootstrapResponse,
  ShopItemCounts,
  ShopItemPage,
  ShopItemRead,
  ShopRead,
  UUID,
} from "@/types/api";

type ItemPageState = {
  items: ShopItemRead[];
  counts: ShopItemCounts | null;
  totalCount: number;
  hasMore: boolean;
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  cursor: {
    group: number | null;
    sortOrder: number | null;
    name: string | null;
    id: UUID | null;
  };
};

const EMPTY_PAGE_STATE: ItemPageState = {
  items: [],
  counts: null,
  totalCount: 0,
  hasMore: false,
  loading: false,
  refreshing: false,
  loadingMore: false,
  error: null,
  cursor: { group: null, sortOrder: null, name: null, id: null },
};

function toPageState(page: ShopItemPage): Pick<
  ItemPageState,
  "items" | "counts" | "totalCount" | "hasMore" | "cursor"
> {
  return {
    items: page.items,
    counts: page.counts,
    totalCount: page.total_count,
    hasMore: page.has_more,
    cursor: {
      group: page.next_cursor_group ?? null,
      sortOrder: page.next_cursor_sort_order ?? null,
      name: page.next_cursor_name ?? null,
      id: page.next_cursor_id ?? null,
    },
  };
}

export function useAdminItemShops() {
  const [shops, setShops] = useState<ShopRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const nextShops = await fetchShops();
      if (mountedRef.current) {
        setShops(nextShops);
        setError(null);
      }
      return nextShops;
    } catch (requestError) {
      const message = toApiError(requestError).message;
      if (mountedRef.current) {
        setError(message);
      }
      throw new Error(message);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  return { shops, loading, error, reload: load };
}

export function useCatalogueItems() {
  const [state, setState] = useState<ItemPageState>(EMPTY_PAGE_STATE);
  const paramsRef = useRef<FetchShopItemsParams>({});
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (params: FetchShopItemsParams = {}, isRefresh = false) => {
    const requestId = ++requestIdRef.current;
    const query = { ...params, limit: params.limit ?? 100 };
    paramsRef.current = query;
    setState((current) => ({
      ...current,
      loading: !isRefresh,
      refreshing: isRefresh,
      error: null,
    }));
    try {
      const page = await fetchCatalogueItemsPage(query);
      if (mountedRef.current && requestId === requestIdRef.current) {
        setState((current) => ({
          ...current,
          ...toPageState(page),
          loading: false,
          refreshing: false,
          error: null,
        }));
      }
      return page;
    } catch (requestError) {
      const message = toApiError(requestError).message;
      if (mountedRef.current && requestId === requestIdRef.current) {
        setState((current) => ({
          ...current,
          loading: false,
          refreshing: false,
          error: message,
        }));
      }
      throw new Error(message);
    }
  }, []);

  const refresh = useCallback(() => load(paramsRef.current, true), [load]);

  const loadMore = useCallback(async () => {
    if (state.loadingMore || !state.hasMore || !state.cursor.name || !state.cursor.id) {
      return null;
    }
    setState((current) => ({ ...current, loadingMore: true, error: null }));
    try {
      const page = await fetchCatalogueItemsPage({
        ...paramsRef.current,
        cursor_sort_order: state.cursor.sortOrder,
        cursor_name: state.cursor.name,
        cursor_id: state.cursor.id,
      });
      setState((current) => {
        const existingIds = new Set(current.items.map((item) => item.id));
        return {
          ...current,
          items: [...current.items, ...page.items.filter((item) => !existingIds.has(item.id))],
          counts: page.counts,
          totalCount: page.total_count,
          hasMore: page.has_more,
          cursor: {
            group: page.next_cursor_group ?? null,
            sortOrder: page.next_cursor_sort_order ?? null,
            name: page.next_cursor_name ?? null,
            id: page.next_cursor_id ?? null,
          },
          loadingMore: false,
        };
      });
      return page;
    } catch (requestError) {
      const message = toApiError(requestError).message;
      setState((current) => ({ ...current, loadingMore: false, error: message }));
      throw new Error(message);
    }
  }, [state.cursor.id, state.cursor.name, state.cursor.sortOrder, state.hasMore, state.loadingMore]);

  const remove = useCallback(async (itemId: UUID) => {
    try {
      await deleteItem(itemId);
      await refresh();
    } catch (requestError) {
      throw new Error(toApiError(requestError).message);
    }
  }, [refresh]);

  return {
    ...state,
    load,
    refresh,
    loadMore,
    deleteItem: remove,
  };
}

export function useShopItems(shopId: UUID | null) {
  const [state, setState] = useState<ItemPageState>(EMPTY_PAGE_STATE);
  const paramsRef = useRef<FetchShopItemsParams>({});
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (params: FetchShopItemsParams = {}, isRefresh = false) => {
    if (!shopId) {
      setState(EMPTY_PAGE_STATE);
      return null;
    }
    const requestId = ++requestIdRef.current;
    const query = { ...params, limit: params.limit ?? 100 };
    paramsRef.current = query;
    setState((current) => ({
      ...current,
      loading: !isRefresh,
      refreshing: isRefresh,
      error: null,
    }));
    try {
      const page = await fetchShopItemsPage(shopId, query);
      if (mountedRef.current && requestId === requestIdRef.current) {
        setState((current) => ({
          ...current,
          ...toPageState(page),
          loading: false,
          refreshing: false,
          error: null,
        }));
      }
      return page;
    } catch (requestError) {
      const message = toApiError(requestError).message;
      if (mountedRef.current && requestId === requestIdRef.current) {
        setState((current) => ({
          ...current,
          loading: false,
          refreshing: false,
          error: message,
        }));
      }
      throw new Error(message);
    }
  }, [shopId]);

  const refresh = useCallback(() => load(paramsRef.current, true), [load]);

  const loadMore = useCallback(async () => {
    if (
      !shopId ||
      state.loadingMore ||
      !state.hasMore ||
      state.cursor.group === null ||
      !state.cursor.name ||
      !state.cursor.id
    ) {
      return null;
    }
    setState((current) => ({ ...current, loadingMore: true, error: null }));
    try {
      const page = await fetchShopItemsPage(shopId, {
        ...paramsRef.current,
        cursor_group: state.cursor.group,
        cursor_sort_order: state.cursor.sortOrder,
        cursor_name: state.cursor.name,
        cursor_id: state.cursor.id,
      });
      setState((current) => {
        const existingIds = new Set(current.items.map((item) => item.id));
        return {
          ...current,
          items: [...current.items, ...page.items.filter((item) => !existingIds.has(item.id))],
          counts: page.counts,
          totalCount: page.total_count,
          hasMore: page.has_more,
          cursor: {
            group: page.next_cursor_group ?? null,
            sortOrder: page.next_cursor_sort_order ?? null,
            name: page.next_cursor_name ?? null,
            id: page.next_cursor_id ?? null,
          },
          loadingMore: false,
        };
      });
      return page;
    } catch (requestError) {
      const message = toApiError(requestError).message;
      setState((current) => ({ ...current, loadingMore: false, error: message }));
      throw new Error(message);
    }
  }, [
    shopId,
    state.cursor.group,
    state.cursor.id,
    state.cursor.name,
    state.cursor.sortOrder,
    state.hasMore,
    state.loadingMore,
  ]);

  const allocate = useCallback(async (itemId: UUID) => {
    if (!shopId) {
      throw new Error("Select a shop before allocating items.");
    }
    try {
      const updatedItem = await allocateShopItem(shopId, itemId);
      setState((current) => ({
        ...current,
        items: current.items.map((item) => (item.id === itemId ? updatedItem : item)),
      }));
      await refresh();
      return updatedItem;
    } catch (requestError) {
      throw new Error(toApiError(requestError).message);
    }
  }, [refresh, shopId]);

  const deallocate = useCallback(async (itemId: UUID) => {
    if (!shopId) {
      throw new Error("Select a shop before removing items.");
    }
    try {
      const updatedItem = await deallocateShopItem(shopId, itemId);
      setState((current) => ({
        ...current,
        items: current.items.map((item) => (item.id === itemId ? updatedItem : item)),
      }));
      await refresh();
      return updatedItem;
    } catch (requestError) {
      throw new Error(toApiError(requestError).message);
    }
  }, [refresh, shopId]);

  const remove = useCallback(async (item: ShopItemRead) => {
    if (!shopId) {
      throw new Error("Select a shop before deleting items.");
    }
    try {
      if (item.scope === ItemScope.Shop) {
        await deleteShopItem(shopId, item.id);
      } else {
        throw new Error("Remove catalogue items from this shop instead of deleting the global catalogue record.");
      }
      await refresh();
    } catch (requestError) {
      throw new Error(toApiError(requestError).message);
    }
  }, [refresh, shopId]);

  return {
    ...state,
    load,
    refresh,
    loadMore,
    allocate,
    deallocate,
    deleteItem: remove,
  };
}

export function useShopPrices(shopId: UUID | null) {
  const [bootstrap, setBootstrap] = useState<ShopBootstrapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [savingItemId, setSavingItemId] = useState<UUID | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draftPrices, setDraftPrices] = useState<Record<UUID, string>>({});
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (isRefresh = false) => {
    if (!shopId) {
      setBootstrap(null);
      return null;
    }
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const nextBootstrap = await fetchShopPriceBootstrap(shopId);
      if (mountedRef.current) {
        setBootstrap(nextBootstrap);
        setError(null);
      }
      return nextBootstrap;
    } catch (requestError) {
      const message = toApiError(requestError).message;
      if (mountedRef.current) {
        setError(message);
      }
      throw new Error(message);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [shopId]);

  useEffect(() => {
    setDraftPrices({});
    void load().catch(() => undefined);
  }, [load]);

  const setDraftPrice = useCallback((itemId: UUID, rawValue: string) => {
    setDraftPrices((current) => ({
      ...current,
      [itemId]: rawValue.replace(/[^\d.]/g, ""),
    }));
  }, []);

  const clearDraftPrice = useCallback((itemId: UUID) => {
    setDraftPrices((current) => {
      const next = { ...current };
      delete next[itemId];
      return next;
    });
  }, []);

  const saveRow = useCallback(async (itemId: UUID, pricePerUnit: string) => {
    if (!shopId) {
      throw new Error("Select a shop before saving prices.");
    }
    setSavingItemId(itemId);
    setError(null);
    try {
      await saveShopDailyPrice(shopId, itemId, { price_per_unit: pricePerUnit });
      clearDraftPrice(itemId);
      return await load(true);
    } catch (requestError) {
      const message = toApiError(requestError).message;
      setError(message);
      throw new Error(message);
    } finally {
      setSavingItemId(null);
    }
  }, [clearDraftPrice, load, shopId]);

  const saveAll = useCallback(async (entries: DailyPriceCreate["entries"]) => {
    if (!shopId) {
      throw new Error("Select a shop before saving prices.");
    }
    setSavingAll(true);
    setError(null);
    try {
      await saveShopDailyPrices(shopId, { entries });
      setDraftPrices({});
      return await load(true);
    } catch (requestError) {
      const message = toApiError(requestError).message;
      setError(message);
      throw new Error(message);
    } finally {
      setSavingAll(false);
    }
  }, [load, shopId]);

  const saveRows = useCallback(async (entries: DailyPriceCreate["entries"]) => {
    if (!shopId) {
      throw new Error("Select a shop before saving prices.");
    }
    if (entries.length === 0) {
      return await load(true);
    }
    setSavingAll(true);
    setError(null);
    try {
      await saveEditedShopDailyPrices(shopId, { entries });
      setDraftPrices((current) => {
        const next = { ...current };
        for (const entry of entries) {
          delete next[entry.item_id];
        }
        return next;
      });
      return await load(true);
    } catch (requestError) {
      const message = toApiError(requestError).message;
      setError(message);
      throw new Error(message);
    } finally {
      setSavingAll(false);
    }
  }, [load, shopId]);

  return {
    bootstrap,
    draftPrices,
    error,
    loading,
    refreshing,
    savingAll,
    savingItemId,
    load,
    setDraftPrice,
    saveRow,
    saveRows,
    saveAll,
  };
}
