import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { fetchShops } from "@/api/admin";
import { toApiError } from "@/api/client";
import {
  allocateShopExpenseItem,
  createExpenseItem,
  deallocateShopExpenseItem,
  deleteExpenseItem,
  fetchAdminExpenseHistory,
  fetchExpenseItemCounts,
  fetchExpenseItemRows,
  fetchShopExpenseItemCandidateRows,
  fetchShopExpenseItemRows,
  updateExpenseItem,
  updateShopExpenseAllocation,
} from "@/api/expenses";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { TextField } from "@/components/ui/text-field";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { AdminExpensesScreenProps } from "@/navigation/types";
import type {
  ExpenseEntryRead,
  ExpenseItemCounts,
  ExpenseItemRead,
  ShopExpenseItemRead,
  ShopRead,
  UUID,
} from "@/types/api";
import { formatCurrency, formatDateTime } from "@/utils/format";

import { adminShadow } from "./admin-dashboard-theme";
import { triggerHaptic } from "./admin-dashboard-utils";
import { AdminHeaderActions } from "./components/admin-header-actions";
import { useAdminTheme } from "./use-admin-theme";

type ExpenseTab = "items" | "allocation" | "history";

type CursorState = {
  sortOrder: number | null;
  name: string | null;
  id: UUID | null;
};

const PAGE_LIMIT = 50;
const CANDIDATE_LIMIT = 20;
const EMPTY_CURSOR: CursorState = { sortOrder: null, name: null, id: null };
const EMPTY_COUNTS: ExpenseItemCounts = {
  all: 0,
  active: 0,
  paused: 0,
  allocated: 0,
  available: 0,
};
const TABS: { key: ExpenseTab; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }[] = [
  { key: "items", label: "Items", icon: "playlist-plus" },
  { key: "allocation", label: "Allocation", icon: "source-branch" },
  { key: "history", label: "History", icon: "history" },
];

function pageCursor(page: {
  next_cursor_sort_order?: number | null;
  next_cursor_name?: string | null;
  next_cursor_id?: UUID | null;
}): CursorState {
  return {
    sortOrder: page.next_cursor_sort_order ?? null,
    name: page.next_cursor_name ?? null,
    id: page.next_cursor_id ?? null,
  };
}

function mergeById<T extends { id: UUID }>(current: T[], nextRows: T[]) {
  const existingIds = new Set(current.map((row) => row.id));
  return [...current, ...nextRows.filter((row) => !existingIds.has(row.id))];
}

function formatCount(value: number, label: string) {
  return `${value} ${label}${value === 1 ? "" : "s"}`;
}

function useSelectedShop(shops: ShopRead[], selectedShopId: UUID | null) {
  return useMemo(
    () => shops.find((shop) => shop.id === selectedShopId) ?? shops[0] ?? null,
    [selectedShopId, shops],
  );
}

function IconButton({
  label,
  icon,
  tone,
  disabled = false,
  loading = false,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  tone: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={() => {
        triggerHaptic();
        onPress();
      }}
      style={({ pressed }) => [
        styles.iconButton,
        {
          borderColor: tone,
          opacity: disabled ? 0.5 : pressed ? 0.78 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={tone} />
      ) : (
        <MaterialCommunityIcons name={icon} size={18} color={tone} />
      )}
    </Pressable>
  );
}

function CountStrip({ counts, palette }: { counts: ExpenseItemCounts; palette: ReturnType<typeof useAdminTheme>["palette"] }) {
  return (
    <View style={styles.countStrip}>
      {[
        ["All", counts.all],
        ["Active", counts.active],
        ["Paused", counts.paused],
        ["Allocated", counts.allocated],
        ["Available", counts.available],
      ].map(([label, value]) => (
        <View key={label} style={[styles.countPill, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
          <Text style={[styles.countValue, { color: palette.textPrimary }]}>{value}</Text>
          <Text style={[styles.countLabel, { color: palette.textMuted }]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

function BranchSelector({
  shops,
  selectedShopId,
  includeAll = false,
  onSelect,
  palette,
}: {
  shops: ShopRead[];
  selectedShopId: UUID | null;
  includeAll?: boolean;
  onSelect: (shopId: UUID | null) => void;
  palette: ReturnType<typeof useAdminTheme>["palette"];
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.branchChips}
    >
      {includeAll ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: selectedShopId === null }}
          onPress={() => onSelect(null)}
          style={[
            styles.branchChip,
            {
              backgroundColor: selectedShopId === null ? palette.cashSoft : palette.card,
              borderColor: selectedShopId === null ? palette.cash : palette.border,
            },
          ]}
        >
          <Text style={[styles.branchChipText, { color: selectedShopId === null ? palette.cash : palette.textPrimary }]}>
            All branches
          </Text>
        </Pressable>
      ) : null}
      {shops.map((shop) => {
        const selected = shop.id === selectedShopId;
        return (
          <Pressable
            key={shop.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onSelect(shop.id)}
            style={[
              styles.branchChip,
              {
                backgroundColor: selected ? palette.cashSoft : palette.card,
                borderColor: selected ? palette.cash : palette.border,
              },
            ]}
          >
            <Text style={[styles.branchChipText, { color: selected ? palette.cash : palette.textPrimary }]} numberOfLines={1}>
              {shop.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function ExpenseItemRow({
  item,
  palette,
  onEdit,
  onDelete,
}: {
  item: ExpenseItemRead;
  palette: ReturnType<typeof useAdminTheme>["palette"];
  onEdit: (item: ExpenseItemRead) => void;
  onDelete: (item: ExpenseItemRead) => void;
}) {
  return (
    <View style={[styles.rowCard, adminShadow(palette.shadow, 0.04, 8, 12), { backgroundColor: palette.card, borderColor: palette.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: palette.cashSoft }]}>
        <MaterialCommunityIcons name="cash-minus" size={20} color={palette.cash} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTitleLine}>
          <Text numberOfLines={1} style={[styles.rowTitle, { color: palette.textPrimary }]}>{item.name}</Text>
          <View style={[styles.statusPill, { backgroundColor: item.is_active ? palette.successSoft : palette.dangerSoft }]}>
            <Text style={[styles.statusText, { color: item.is_active ? palette.success : palette.danger }]}>
              {item.is_active ? "Active" : "Paused"}
            </Text>
          </View>
        </View>
        <Text numberOfLines={1} style={[styles.rowSubtitle, { color: palette.textSecondary }]}>{item.tamil_name}</Text>
        <Text numberOfLines={1} style={[styles.rowMeta, { color: palette.textMuted }]}>
          {formatCount(item.allocated_shop_count, "branch")} · {formatCount(item.entry_count, "entry")} · Sort {item.sort_order}
        </Text>
      </View>
      <View style={styles.rowActions}>
        <IconButton label="Edit expense item" icon="pencil-outline" tone={palette.cash} onPress={() => onEdit(item)} />
        <IconButton
          label="Delete expense item"
          icon="trash-can-outline"
          tone={palette.danger}
          disabled={!item.can_delete}
          onPress={() => onDelete(item)}
        />
      </View>
    </View>
  );
}

function AllocationRow({
  item,
  palette,
  busy,
  onToggle,
  onRemove,
}: {
  item: ShopExpenseItemRead;
  palette: ReturnType<typeof useAdminTheme>["palette"];
  busy: boolean;
  onToggle: (item: ShopExpenseItemRead) => void;
  onRemove: (item: ShopExpenseItemRead) => void;
}) {
  return (
    <View style={[styles.rowCard, adminShadow(palette.shadow, 0.04, 8, 12), { backgroundColor: palette.card, borderColor: palette.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: item.allocation_is_active ? palette.cashSoft : palette.dangerSoft }]}>
        <MaterialCommunityIcons
          name={item.allocation_is_active ? "cash-check" : "cash-remove"}
          size={20}
          color={item.allocation_is_active ? palette.cash : palette.danger}
        />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTitleLine}>
          <Text numberOfLines={1} style={[styles.rowTitle, { color: palette.textPrimary }]}>{item.name}</Text>
          <View style={[styles.statusPill, { backgroundColor: item.allocation_is_active ? palette.successSoft : palette.dangerSoft }]}>
            <Text style={[styles.statusText, { color: item.allocation_is_active ? palette.success : palette.danger }]}>
              {item.allocation_is_active ? "Usable" : "Hidden"}
            </Text>
          </View>
        </View>
        <Text numberOfLines={1} style={[styles.rowSubtitle, { color: palette.textSecondary }]}>{item.tamil_name}</Text>
        <Text numberOfLines={1} style={[styles.rowMeta, { color: palette.textMuted }]}>
          Order {item.allocation_sort_order} · {formatCount(item.entry_count, "entry")}
        </Text>
      </View>
      <View style={styles.rowActions}>
        <IconButton
          label={item.allocation_is_active ? "Pause expense allocation" : "Resume expense allocation"}
          icon={item.allocation_is_active ? "pause-circle-outline" : "play-circle-outline"}
          tone={item.allocation_is_active ? palette.textSecondary : palette.success}
          loading={busy}
          onPress={() => onToggle(item)}
        />
        <IconButton
          label="Remove expense allocation"
          icon="link-off"
          tone={palette.danger}
          loading={busy}
          onPress={() => onRemove(item)}
        />
      </View>
    </View>
  );
}

function HistoryRow({
  entry,
  palette,
}: {
  entry: ExpenseEntryRead;
  palette: ReturnType<typeof useAdminTheme>["palette"];
}) {
  return (
    <View style={[styles.rowCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: palette.cashSoft }]}>
        <MaterialCommunityIcons name="receipt-text-clock-outline" size={20} color={palette.cash} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTitleLine}>
          <Text numberOfLines={1} style={[styles.rowTitle, { color: palette.textPrimary }]}>{entry.expense_name}</Text>
          <Text style={[styles.amountText, { color: palette.cash }]}>{formatCurrency(entry.amount)}</Text>
        </View>
        <Text numberOfLines={1} style={[styles.rowSubtitle, { color: palette.textSecondary }]}>
          {entry.shop_name} · {entry.expense_tamil_name}
        </Text>
        <Text numberOfLines={1} style={[styles.rowMeta, { color: palette.textMuted }]}>
          {formatDateTime(entry.spent_at)}{entry.note ? ` · ${entry.note}` : ""}
        </Text>
      </View>
    </View>
  );
}

export function AdminExpensesScreen({ navigation, route }: AdminExpensesScreenProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme, palette } = useAdminTheme();
  const [activeTab, setActiveTab] = useState<ExpenseTab>("items");
  const [shops, setShops] = useState<ShopRead[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<UUID | null>(route.params?.shopId ?? null);
  const selectedShop = useSelectedShop(shops, selectedShopId);

  const [itemSearch, setItemSearch] = useState("");
  const debouncedItemSearch = useDebouncedValue(itemSearch.trim());
  const [itemRows, setItemRows] = useState<ExpenseItemRead[]>([]);
  const [itemCounts, setItemCounts] = useState<ExpenseItemCounts>(EMPTY_COUNTS);
  const [itemCursor, setItemCursor] = useState<CursorState>(EMPTY_CURSOR);
  const [itemHasMore, setItemHasMore] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsLoadingMore, setItemsLoadingMore] = useState(false);

  const [candidateSearch, setCandidateSearch] = useState("");
  const debouncedCandidateSearch = useDebouncedValue(candidateSearch.trim());
  const [candidateRows, setCandidateRows] = useState<ExpenseItemRead[]>([]);
  const [allocationRows, setAllocationRows] = useState<ShopExpenseItemRead[]>([]);
  const [allocationCursor, setAllocationCursor] = useState<CursorState>(EMPTY_CURSOR);
  const [allocationHasMore, setAllocationHasMore] = useState(false);
  const [allocationLoading, setAllocationLoading] = useState(false);
  const [allocationLoadingMore, setAllocationLoadingMore] = useState(false);
  const [allocationBusyId, setAllocationBusyId] = useState<UUID | null>(null);

  const [historyRows, setHistoryRows] = useState<ExpenseEntryRead[]>([]);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyCursor, setHistoryCursor] = useState<{ spentAt: string | null; id: UUID | null }>({
    spentAt: null,
    id: null,
  });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseItemRead | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [tamilNameDraft, setTamilNameDraft] = useState("");
  const [sortOrderDraft, setSortOrderDraft] = useState("0");
  const [activeDraft, setActiveDraft] = useState(true);
  const [savingItem, setSavingItem] = useState(false);

  const listPaddingBottom = 30 + insets.bottom;

  const loadShops = useCallback(async () => {
    const loadedShops = await fetchShops();
    setShops(loadedShops);
    setSelectedShopId((current) => current ?? loadedShops[0]?.id ?? null);
  }, []);

  const loadItems = useCallback(async () => {
    setItemsLoading(true);
    setErrorMessage(null);
    try {
      const [page, counts] = await Promise.all([
        fetchExpenseItemRows({ q: debouncedItemSearch, limit: PAGE_LIMIT }),
        fetchExpenseItemCounts({ q: debouncedItemSearch }),
      ]);
      setItemRows(page.items);
      setItemCounts(counts);
      setItemCursor(pageCursor(page));
      setItemHasMore(page.has_more);
    } catch (error) {
      setErrorMessage(toApiError(error).message || "Unable to load expense items.");
    } finally {
      setItemsLoading(false);
    }
  }, [debouncedItemSearch]);

  const loadMoreItems = useCallback(async () => {
    if (!itemHasMore || itemsLoading || itemsLoadingMore) {
      return;
    }
    setItemsLoadingMore(true);
    try {
      const page = await fetchExpenseItemRows({
        q: debouncedItemSearch,
        limit: PAGE_LIMIT,
        cursor_sort_order: itemCursor.sortOrder,
        cursor_name: itemCursor.name,
        cursor_id: itemCursor.id,
      });
      setItemRows((current) => mergeById(current, page.items));
      setItemCursor(pageCursor(page));
      setItemHasMore(page.has_more);
    } catch (error) {
      setErrorMessage(toApiError(error).message || "Unable to load more expense items.");
    } finally {
      setItemsLoadingMore(false);
    }
  }, [debouncedItemSearch, itemCursor, itemHasMore, itemsLoading, itemsLoadingMore]);

  const loadAllocation = useCallback(async () => {
    if (!selectedShop) {
      setAllocationRows([]);
      setCandidateRows([]);
      return;
    }
    setAllocationLoading(true);
    setErrorMessage(null);
    try {
      const [allocationPage, candidatePage] = await Promise.all([
        fetchShopExpenseItemRows(selectedShop.id, { limit: PAGE_LIMIT }),
        fetchShopExpenseItemCandidateRows(selectedShop.id, {
          q: debouncedCandidateSearch,
          limit: CANDIDATE_LIMIT,
        }),
      ]);
      setAllocationRows(allocationPage.items);
      setAllocationCursor(pageCursor(allocationPage));
      setAllocationHasMore(allocationPage.has_more);
      setCandidateRows(candidatePage.items);
    } catch (error) {
      setErrorMessage(toApiError(error).message || "Unable to load branch expenses.");
    } finally {
      setAllocationLoading(false);
    }
  }, [debouncedCandidateSearch, selectedShop]);

  const loadMoreAllocation = useCallback(async () => {
    if (!selectedShop || !allocationHasMore || allocationLoading || allocationLoadingMore) {
      return;
    }
    setAllocationLoadingMore(true);
    try {
      const page = await fetchShopExpenseItemRows(selectedShop.id, {
        limit: PAGE_LIMIT,
        cursor_sort_order: allocationCursor.sortOrder,
        cursor_name: allocationCursor.name,
        cursor_id: allocationCursor.id,
      });
      setAllocationRows((current) => mergeById(current, page.items));
      setAllocationCursor(pageCursor(page));
      setAllocationHasMore(page.has_more);
    } catch (error) {
      setErrorMessage(toApiError(error).message || "Unable to load more branch expenses.");
    } finally {
      setAllocationLoadingMore(false);
    }
  }, [allocationCursor, allocationHasMore, allocationLoading, allocationLoadingMore, selectedShop]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setErrorMessage(null);
    try {
      const page = await fetchAdminExpenseHistory({
        shop_id: activeTab === "history" ? selectedShopId : null,
        limit: PAGE_LIMIT,
      });
      setHistoryRows(page.items);
      setHistoryHasMore(page.has_more);
      setHistoryCursor({
        spentAt: page.next_cursor_spent_at ?? null,
        id: page.next_cursor_id ?? null,
      });
    } catch (error) {
      setErrorMessage(toApiError(error).message || "Unable to load expense history.");
    } finally {
      setHistoryLoading(false);
    }
  }, [activeTab, selectedShopId]);

  const loadMoreHistory = useCallback(async () => {
    if (!historyHasMore || historyLoading || historyLoadingMore) {
      return;
    }
    setHistoryLoadingMore(true);
    try {
      const page = await fetchAdminExpenseHistory({
        shop_id: selectedShopId,
        limit: PAGE_LIMIT,
        cursor_spent_at: historyCursor.spentAt,
        cursor_id: historyCursor.id,
      });
      setHistoryRows((current) => mergeById(current, page.items));
      setHistoryHasMore(page.has_more);
      setHistoryCursor({
        spentAt: page.next_cursor_spent_at ?? null,
        id: page.next_cursor_id ?? null,
      });
    } catch (error) {
      setErrorMessage(toApiError(error).message || "Unable to load more expense history.");
    } finally {
      setHistoryLoadingMore(false);
    }
  }, [historyCursor, historyHasMore, historyLoading, historyLoadingMore, selectedShopId]);

  const refreshCurrentTab = useCallback(async () => {
    setRefreshing(true);
    try {
      if (activeTab === "items") {
        await loadItems();
      } else if (activeTab === "allocation") {
        await loadAllocation();
      } else {
        await loadHistory();
      }
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, loadAllocation, loadHistory, loadItems]);

  useEffect(() => {
    void loadShops();
  }, [loadShops]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (activeTab === "allocation") {
      void loadAllocation();
    }
  }, [activeTab, loadAllocation]);

  useEffect(() => {
    if (activeTab === "history") {
      void loadHistory();
    }
  }, [activeTab, loadHistory]);

  const openCreateEditor = useCallback(() => {
    setEditingItem(null);
    setNameDraft("");
    setTamilNameDraft("");
    setSortOrderDraft("0");
    setActiveDraft(true);
    setEditorOpen(true);
  }, []);

  const openEditEditor = useCallback((item: ExpenseItemRead) => {
    setEditingItem(item);
    setNameDraft(item.name);
    setTamilNameDraft(item.tamil_name);
    setSortOrderDraft(String(item.sort_order));
    setActiveDraft(item.is_active);
    setEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    if (savingItem) {
      return;
    }
    setEditorOpen(false);
  }, [savingItem]);

  const saveExpenseItem = useCallback(async () => {
    const name = nameDraft.trim();
    const tamilName = tamilNameDraft.trim();
    const sortOrder = Number.parseInt(sortOrderDraft.trim() || "0", 10);
    if (name.length < 2 || !tamilName || !Number.isFinite(sortOrder)) {
      Alert.alert("Check expense item", "Enter name, Tamil name, and a valid sort order.");
      return;
    }
    setSavingItem(true);
    try {
      if (editingItem) {
        await updateExpenseItem(editingItem.id, {
          name,
          tamil_name: tamilName,
          sort_order: sortOrder,
          is_active: activeDraft,
        });
      } else {
        await createExpenseItem({
          name,
          tamil_name: tamilName,
          sort_order: sortOrder,
          is_active: activeDraft,
        });
      }
      setEditorOpen(false);
      await loadItems();
      if (activeTab === "allocation") {
        await loadAllocation();
      }
    } catch (error) {
      Alert.alert("Save failed", toApiError(error).message || "Unable to save expense item.");
    } finally {
      setSavingItem(false);
    }
  }, [
    activeDraft,
    activeTab,
    editingItem,
    loadAllocation,
    loadItems,
    nameDraft,
    sortOrderDraft,
    tamilNameDraft,
  ]);

  const confirmDeleteItem = useCallback((item: ExpenseItemRead) => {
    Alert.alert(
      "Delete expense item?",
      `${item.name} can be deleted only if it has no allocation or history.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void deleteExpenseItem(item.id)
              .then(loadItems)
              .catch((error) => Alert.alert("Delete failed", toApiError(error).message));
          },
        },
      ],
    );
  }, [loadItems]);

  const allocateCandidate = useCallback(async (item: ExpenseItemRead) => {
    if (!selectedShop) {
      return;
    }
    setAllocationBusyId(item.id);
    try {
      await allocateShopExpenseItem(selectedShop.id, item.id);
      await loadAllocation();
      await loadItems();
    } catch (error) {
      Alert.alert("Allocation failed", toApiError(error).message || "Unable to allocate expense item.");
    } finally {
      setAllocationBusyId(null);
    }
  }, [loadAllocation, loadItems, selectedShop]);

  const toggleAllocation = useCallback(async (item: ShopExpenseItemRead) => {
    if (!selectedShop) {
      return;
    }
    setAllocationBusyId(item.id);
    try {
      const updated = await updateShopExpenseAllocation(selectedShop.id, item.id, {
        is_active: !item.allocation_is_active,
      });
      setAllocationRows((current) => current.map((row) => (row.id === updated.id ? updated : row)));
    } catch (error) {
      Alert.alert("Update failed", toApiError(error).message || "Unable to update allocation.");
    } finally {
      setAllocationBusyId(null);
    }
  }, [selectedShop]);

  const removeAllocation = useCallback((item: ShopExpenseItemRead) => {
    if (!selectedShop) {
      return;
    }
    Alert.alert("Remove allocation?", `${item.name} will no longer be available to this branch.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setAllocationBusyId(item.id);
          void deallocateShopExpenseItem(selectedShop.id, item.id)
            .then(async () => {
              await loadAllocation();
              await loadItems();
            })
            .catch((error) => Alert.alert("Remove failed", toApiError(error).message))
            .finally(() => setAllocationBusyId(null));
        },
      },
    ]);
  }, [loadAllocation, loadItems, selectedShop]);

  const renderHeader = () => (
    <>
      {errorMessage ? (
        <View style={[styles.errorBanner, { backgroundColor: palette.dangerSoft, borderColor: palette.danger }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color={palette.danger} />
          <Text style={[styles.errorText, { color: palette.danger }]}>{errorMessage}</Text>
        </View>
      ) : null}
    </>
  );

  const allocationHeader = () => (
    <View style={styles.listHeader}>
      <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Branch allocation</Text>
      <Text style={[styles.sectionSubtitle, { color: palette.textMuted }]}>
        Shops can only record expenses from active items allocated here.
      </Text>
      <BranchSelector
        shops={shops}
        selectedShopId={selectedShop?.id ?? null}
        onSelect={setSelectedShopId}
        palette={palette}
      />
      <View style={styles.headerActions}>
        <Button
          label="Arrange order"
          variant="secondary"
          onPress={() => selectedShop && navigation.navigate("AdminShopExpensesOrder", {
            shopId: selectedShop.id,
            shopName: selectedShop.name,
          })}
          disabled={!selectedShop || allocationRows.length === 0}
          className="flex-1"
        />
        <Button
          label="New item"
          onPress={openCreateEditor}
          className="flex-1"
        />
      </View>
      <View style={[styles.searchBox, { borderColor: palette.border, backgroundColor: palette.card }]}>
        <MaterialCommunityIcons name="magnify" size={18} color={palette.textMuted} />
        <TextInput
          value={candidateSearch}
          onChangeText={setCandidateSearch}
          placeholder="Search unallocated items"
          placeholderTextColor={palette.textMuted}
          style={[styles.searchInput, { color: palette.textPrimary }]}
        />
      </View>
      <View style={styles.candidateWrap}>
        {candidateRows.length === 0 ? (
          <Text style={[styles.smallMuted, { color: palette.textMuted }]}>No unallocated expense items match this branch.</Text>
        ) : (
          candidateRows.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => allocateCandidate(item)}
              disabled={allocationBusyId === item.id}
              style={[styles.candidateRow, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}
            >
              <View style={styles.rowBody}>
                <Text numberOfLines={1} style={[styles.candidateTitle, { color: palette.textPrimary }]}>{item.name}</Text>
                <Text numberOfLines={1} style={[styles.rowMeta, { color: palette.textMuted }]}>{item.tamil_name}</Text>
              </View>
              {allocationBusyId === item.id ? (
                <ActivityIndicator size="small" color={palette.cash} />
              ) : (
                <MaterialCommunityIcons name="plus-circle-outline" size={20} color={palette.cash} />
              )}
            </Pressable>
          ))
        )}
      </View>
      <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
        Allocated to {selectedShop?.name ?? "branch"}
      </Text>
    </View>
  );

  const historyHeader = () => (
    <View style={styles.listHeader}>
      <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Expense history</Text>
      <Text style={[styles.sectionSubtitle, { color: palette.textMuted }]}>
        View entries from every branch or filter to one branch.
      </Text>
      <BranchSelector
        shops={shops}
        selectedShopId={selectedShopId}
        includeAll
        onSelect={setSelectedShopId}
        palette={palette}
      />
    </View>
  );

  const itemsHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.headerActions}>
        <View style={styles.rowBody}>
          <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Expense items</Text>
          <Text style={[styles.sectionSubtitle, { color: palette.textMuted }]}>
            Independent from billing items. No price, unit, image, category, or checkout fields.
          </Text>
        </View>
        <Button label="New item" onPress={openCreateEditor} />
      </View>
      <View style={[styles.searchBox, { borderColor: palette.border, backgroundColor: palette.card }]}>
        <MaterialCommunityIcons name="magnify" size={18} color={palette.textMuted} />
        <TextInput
          value={itemSearch}
          onChangeText={setItemSearch}
          placeholder="Search expense items"
          placeholderTextColor={palette.textMuted}
          style={[styles.searchInput, { color: palette.textPrimary }]}
        />
      </View>
      <CountStrip counts={itemCounts} palette={palette} />
    </View>
  );

  const content = (() => {
    if (activeTab === "items") {
      if (itemsLoading && itemRows.length === 0) {
        return <LoadingState fullscreen label="Loading expenses..." />;
      }
      return (
        <FlatList
          data={itemRows}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExpenseItemRow item={item} palette={palette} onEdit={openEditEditor} onDelete={confirmDeleteItem} />
          )}
          ListHeaderComponent={<>{renderHeader()}{itemsHeader()}</>}
          ListEmptyComponent={<EmptyState title="No expense items" description="Create the first expense item for branch use." />}
          ListFooterComponent={itemsLoadingMore ? <ActivityIndicator color={palette.cash} style={styles.footerLoader} /> : null}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshCurrentTab} tintColor={palette.cash} />}
          onEndReached={loadMoreItems}
          onEndReachedThreshold={0.45}
          contentContainerStyle={[styles.listContent, { paddingBottom: listPaddingBottom }]}
        />
      );
    }

    if (activeTab === "allocation") {
      if (allocationLoading && allocationRows.length === 0) {
        return <LoadingState fullscreen label="Loading branch allocation..." />;
      }
      return (
        <FlatList
          data={allocationRows}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AllocationRow
              item={item}
              palette={palette}
              busy={allocationBusyId === item.id}
              onToggle={toggleAllocation}
              onRemove={removeAllocation}
            />
          )}
          ListHeaderComponent={<>{renderHeader()}{allocationHeader()}</>}
          ListEmptyComponent={<EmptyState title="No allocated expenses" description="Allocate expense items to this branch." />}
          ListFooterComponent={allocationLoadingMore ? <ActivityIndicator color={palette.cash} style={styles.footerLoader} /> : null}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshCurrentTab} tintColor={palette.cash} />}
          onEndReached={loadMoreAllocation}
          onEndReachedThreshold={0.45}
          contentContainerStyle={[styles.listContent, { paddingBottom: listPaddingBottom }]}
        />
      );
    }

    if (historyLoading && historyRows.length === 0) {
      return <LoadingState fullscreen label="Loading expense history..." />;
    }
    return (
      <FlatList
        data={historyRows}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <HistoryRow entry={item} palette={palette} />}
        ListHeaderComponent={<>{renderHeader()}{historyHeader()}</>}
        ListEmptyComponent={<EmptyState title="No expense history" description="Shop entries will appear here after they record expenses." />}
        ListFooterComponent={historyLoadingMore ? <ActivityIndicator color={palette.cash} style={styles.footerLoader} /> : null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshCurrentTab} tintColor={palette.cash} />}
        onEndReached={loadMoreHistory}
        onEndReachedThreshold={0.45}
        contentContainerStyle={[styles.listContent, { paddingBottom: listPaddingBottom }]}
      />
    );
  })();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]} edges={["top", "left", "right"]}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <View style={[styles.topBar, { borderBottomColor: palette.border }]}>
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={palette.textPrimary} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: palette.textPrimary }]}>Expenses</Text>
          <Text style={[styles.subtitle, { color: palette.textMuted }]}>Standalone branch expense control</Text>
        </View>
        <AdminHeaderActions refreshing={refreshing} onRefresh={refreshCurrentTab} />
      </View>

      <View style={[styles.tabs, { borderBottomColor: palette.border }]}>
        {TABS.map((tab) => {
          const selected = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => {
                triggerHaptic();
                setActiveTab(tab.key);
              }}
              style={[
                styles.tabButton,
                {
                  backgroundColor: selected ? palette.cashSoft : palette.card,
                  borderColor: selected ? palette.cash : palette.border,
                },
              ]}
            >
              <MaterialCommunityIcons name={tab.icon} size={17} color={selected ? palette.cash : palette.textMuted} />
              <Text style={[styles.tabLabel, { color: selected ? palette.cash : palette.textPrimary }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {content}

      <Modal visible={editorOpen} animationType="slide" transparent onRequestClose={closeEditor}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={[styles.modalBackdrop, { backgroundColor: palette.overlay }]}
        >
          <View style={[styles.modalCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>
              {editingItem ? "Edit expense item" : "Create expense item"}
            </Text>
            <TextField label="Name" value={nameDraft} onChangeText={setNameDraft} placeholder="Example: Transport" />
            <TextField label="Tamil name" value={tamilNameDraft} onChangeText={setTamilNameDraft} placeholder="தமிழ் பெயர்" />
            <TextField
              label="Sort order"
              value={sortOrderDraft}
              onChangeText={setSortOrderDraft}
              keyboardType="number-pad"
              placeholder="0"
            />
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: activeDraft }}
              onPress={() => setActiveDraft((current) => !current)}
              style={[styles.switchRow, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}
            >
              <View style={[styles.switchIcon, { backgroundColor: activeDraft ? palette.successSoft : palette.dangerSoft }]}>
                <MaterialCommunityIcons
                  name={activeDraft ? "check-circle-outline" : "pause-circle-outline"}
                  size={18}
                  color={activeDraft ? palette.success : palette.danger}
                />
              </View>
              <View style={styles.rowBody}>
                <Text style={[styles.switchTitle, { color: palette.textPrimary }]}>Active</Text>
                <Text style={[styles.switchSubtitle, { color: palette.textMuted }]}>
                  Inactive expense items cannot be allocated to branches.
                </Text>
              </View>
            </Pressable>
            <View style={styles.modalActions}>
              <Button label="Cancel" variant="secondary" onPress={closeEditor} disabled={savingItem} className="flex-1" />
              <Button
                label={editingItem ? "Save changes" : "Create item"}
                onPress={saveExpenseItem}
                loading={savingItem}
                className="flex-1"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    minHeight: 62,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  tabLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
  },
  listContent: {
    gap: 10,
    padding: 14,
  },
  listHeader: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
  },
  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchBox: {
    minHeight: 46,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    minHeight: 42,
    fontSize: 14,
    fontWeight: "700",
  },
  countStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  countPill: {
    minWidth: 84,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  countValue: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900",
  },
  countLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
  },
  rowCard: {
    minHeight: 82,
    borderRadius: 14,
    borderWidth: 1,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTitleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },
  rowMeta: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "900",
  },
  amountText: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
  },
  branchChips: {
    gap: 8,
    paddingRight: 14,
  },
  branchChip: {
    maxWidth: 180,
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  branchChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
  },
  candidateWrap: {
    gap: 8,
  },
  candidateRow: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  candidateTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
  },
  smallMuted: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  errorBanner: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },
  footerLoader: {
    paddingVertical: 18,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  modalTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
  },
  switchRow: {
    minHeight: 62,
    borderRadius: 14,
    borderWidth: 1,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  switchIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  switchTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
  },
  switchSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
});
