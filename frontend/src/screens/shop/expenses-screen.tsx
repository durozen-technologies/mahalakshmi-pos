import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { toApiError } from "@/api/client";
import {
  createShopExpenseEntry,
  fetchCurrentShopExpenseItems,
  fetchShopExpenseHistory,
} from "@/api/expenses";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { TextField } from "@/components/ui/text-field";
import {
  getLocalizedItemName,
  useShopTranslation,
} from "@/hooks/use-shop-translation";
import type { ShopExpensesScreenProps } from "@/navigation/types";
import type { ExpenseEntryRead, ShopExpenseItemRead, UUID } from "@/types/api";
import { formatCurrency, formatDateTime } from "@/utils/format";

type CursorState = {
  sortOrder: number | null;
  name: string | null;
  id: UUID | null;
};

const PAGE_LIMIT = 50;
const EMPTY_CURSOR: CursorState = { sortOrder: null, name: null, id: null };

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

function isValidAmount(value: string) {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return false;
  }
  return Number(trimmed) > 0;
}

function ExpenseRow({
  item,
  displayName,
  onPress,
}: {
  item: ShopExpenseItemRead;
  displayName: string;
  onPress: (item: ShopExpenseItemRead) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Record expense for ${displayName}`}
      onPress={() => onPress(item)}
      className="mb-3 rounded-[18px] border border-border bg-card p-4 shadow-soft"
    >
      <View className="flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-[15px] bg-[#FAEFD8]">
          <MaterialCommunityIcons name="cash-minus" size={22} color="#9A6700" />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-base font-extrabold leading-6 text-ink" numberOfLines={1}>
            {displayName}
          </Text>
          <Text className="mt-0.5 text-sm font-semibold leading-5 text-muted" numberOfLines={1}>
            {item.tamil_name}
          </Text>
          <Text className="mt-1 text-xs font-semibold text-muted">
            Tap to enter amount
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color="#6C7A70" />
      </View>
    </Pressable>
  );
}

function HistoryRow({ entry }: { entry: ExpenseEntryRead }) {
  return (
    <View className="mb-3 rounded-[16px] border border-border bg-card p-4">
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-[13px] bg-[#FAEFD8]">
          <MaterialCommunityIcons name="receipt-text-clock-outline" size={20} color="#9A6700" />
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row items-start gap-3">
            <Text className="min-w-0 flex-1 text-sm font-extrabold text-ink" numberOfLines={1}>
              {entry.expense_name}
            </Text>
            <Text className="text-sm font-extrabold text-[#9A6700]">
              {formatCurrency(entry.amount)}
            </Text>
          </View>
          <Text className="mt-0.5 text-xs font-semibold text-muted" numberOfLines={1}>
            {formatDateTime(entry.spent_at)}
          </Text>
          {entry.note ? (
            <Text className="mt-2 text-sm leading-5 text-muted" numberOfLines={2}>
              {entry.note}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function ShopExpensesScreen(_: ShopExpensesScreenProps) {
  const insets = useSafeAreaInsets();
  const { language } = useShopTranslation();
  const [items, setItems] = useState<ShopExpenseItemRead[]>([]);
  const [cursor, setCursor] = useState<CursorState>(EMPTY_CURSOR);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyRows, setHistoryRows] = useState<ExpenseEntryRead[]>([]);
  const [historyCursor, setHistoryCursor] = useState<{ spentAt: string | null; id: UUID | null }>({
    spentAt: null,
    id: null,
  });

  const [selectedItem, setSelectedItem] = useState<ShopExpenseItemRead | null>(null);
  const [amountDraft, setAmountDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const visibleItems = useMemo(
    () => items.filter((item) => item.is_active && item.allocation_is_active),
    [items],
  );

  const loadItems = useCallback(async (refresh = false) => {
    setErrorMessage(null);
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const page = await fetchCurrentShopExpenseItems({ limit: PAGE_LIMIT });
      setItems(page.items);
      setCursor(pageCursor(page));
      setHasMore(page.has_more);
    } catch (error) {
      setErrorMessage(toApiError(error).message || "Unable to load expenses.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMoreItems = useCallback(async () => {
    if (!hasMore || loading || loadingMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const page = await fetchCurrentShopExpenseItems({
        limit: PAGE_LIMIT,
        cursor_sort_order: cursor.sortOrder,
        cursor_name: cursor.name,
        cursor_id: cursor.id,
      });
      setItems((current) => mergeById(current, page.items));
      setCursor(pageCursor(page));
      setHasMore(page.has_more);
    } catch (error) {
      setErrorMessage(toApiError(error).message || "Unable to load more expenses.");
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, hasMore, loading, loadingMore]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setErrorMessage(null);
    try {
      const page = await fetchShopExpenseHistory({ limit: 30 });
      setHistoryRows(page.items);
      setHistoryHasMore(page.has_more);
      setHistoryCursor({
        spentAt: page.next_cursor_spent_at ?? null,
        id: page.next_cursor_id ?? null,
      });
      setHistoryLoaded(true);
    } catch (error) {
      setErrorMessage(toApiError(error).message || "Unable to load expense history.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadMoreHistory = useCallback(async () => {
    if (!historyHasMore || historyLoading || historyLoadingMore) {
      return;
    }
    setHistoryLoadingMore(true);
    try {
      const page = await fetchShopExpenseHistory({
        limit: 30,
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
  }, [historyCursor, historyHasMore, historyLoading, historyLoadingMore]);

  useFocusEffect(
    useCallback(() => {
      void loadItems();
    }, [loadItems]),
  );

  const openExpenseModal = useCallback((item: ShopExpenseItemRead) => {
    setSelectedItem(item);
    setAmountDraft("");
    setNoteDraft("");
  }, []);

  const closeExpenseModal = useCallback(() => {
    if (saving) {
      return;
    }
    setSelectedItem(null);
  }, [saving]);

  const submitExpense = useCallback(async () => {
    if (!selectedItem) {
      return;
    }
    if (!isValidAmount(amountDraft)) {
      Alert.alert("Invalid amount", "Enter a valid rupee amount with up to 2 decimals.");
      return;
    }
    setSaving(true);
    try {
      const entry = await createShopExpenseEntry({
        expense_item_id: selectedItem.id,
        amount: Number(amountDraft).toFixed(2),
        note: noteDraft.trim() || null,
      });
      setSelectedItem(null);
      if (historyLoaded) {
        setHistoryRows((current) => mergeById([entry], current).slice(0, 30));
      }
    } catch (error) {
      Alert.alert("Save failed", toApiError(error).message || "Unable to record expense.");
    } finally {
      setSaving(false);
    }
  }, [amountDraft, historyLoaded, noteDraft, selectedItem]);

  const toggleHistory = useCallback(() => {
    setHistoryOpen((current) => {
      const nextOpen = !current;
      if (nextOpen && !historyLoaded && !historyLoading) {
        void loadHistory();
      }
      return nextOpen;
    });
  }, [historyLoaded, historyLoading, loadHistory]);

  const renderListHeader = () => (
    <View className="mb-4 gap-4">
      <View className="rounded-[20px] border border-border bg-card p-4 shadow-soft">
        <View className="flex-row items-start gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-[15px] bg-[#FAEFD8]">
            <MaterialCommunityIcons name="cash-fast" size={23} color="#9A6700" />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-lg font-extrabold leading-7 text-ink">
              Branch expenses
            </Text>
            <Text className="mt-1 text-sm leading-6 text-muted">
              Enter expenses only from the items assigned by admin.
            </Text>
          </View>
        </View>
        <Button
          label={historyOpen ? "Hide history" : "History"}
          onPress={toggleHistory}
          variant="secondary"
          className="mt-4"
        />
      </View>

      {errorMessage ? (
        <View className="flex-row items-center gap-2 rounded-[16px] border border-[#B42318] bg-[#FEE4E2] px-4 py-3">
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#B42318" />
          <Text className="min-w-0 flex-1 text-sm font-semibold text-[#B42318]">{errorMessage}</Text>
        </View>
      ) : null}

      {historyOpen ? (
        <View>
          <Text className="mb-3 text-base font-extrabold text-ink">Recent history</Text>
          {historyLoading && historyRows.length === 0 ? (
            <ActivityIndicator color="#244734" />
          ) : historyRows.length === 0 ? (
            <EmptyState title="No expense history" description="Recorded expense entries will show here." />
          ) : (
            <>
              {historyRows.map((entry) => <HistoryRow key={entry.id} entry={entry} />)}
              {historyHasMore ? (
                <Button
                  label={historyLoadingMore ? "Loading..." : "Load more history"}
                  onPress={loadMoreHistory}
                  loading={historyLoadingMore}
                  variant="secondary"
                />
              ) : null}
            </>
          )}
        </View>
      ) : null}

      <Text className="text-base font-extrabold text-ink">Allocated expense items</Text>
    </View>
  );

  if (loading && items.length === 0) {
    return <LoadingState fullscreen label="Loading expenses..." />;
  }

  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1 bg-cream">
      <FlatList
        data={visibleItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExpenseRow
            item={item}
            displayName={getLocalizedItemName(language, item.name, item.tamil_name)}
            onPress={openExpenseModal}
          />
        )}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={
          <EmptyState
            title="No expense items"
            description="Ask an admin to allocate expense items to this branch."
          />
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator color="#244734" style={styles.footerLoader} /> : null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadItems(true)} tintColor="#244734" />}
        onEndReached={loadMoreItems}
        onEndReachedThreshold={0.45}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 112 + insets.bottom,
        }}
      />

      <Modal visible={Boolean(selectedItem)} animationType="slide" transparent onRequestClose={closeExpenseModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalBackdrop}
        >
          <View className="rounded-t-[26px] border border-border bg-card p-5">
            <Text className="text-lg font-extrabold text-ink" numberOfLines={1}>
              {selectedItem ? getLocalizedItemName(language, selectedItem.name, selectedItem.tamil_name) : "Expense"}
            </Text>
            <Text className="mt-1 text-sm font-semibold text-muted" numberOfLines={1}>
              {selectedItem?.tamil_name}
            </Text>

            <View className="mt-5 gap-4">
              <TextField
                label="Amount in rupees"
                value={amountDraft}
                onChangeText={setAmountDraft}
                keyboardType="decimal-pad"
                placeholder="Example 250.00"
              />
              <TextField
                label="Note"
                value={noteDraft}
                onChangeText={setNoteDraft}
                placeholder="Optional"
              />
            </View>

            <View className="mt-5 flex-row gap-3">
              <Button
                label="Cancel"
                variant="secondary"
                onPress={closeExpenseModal}
                disabled={saving}
                className="flex-1"
              />
              <Button
                label="Save expense"
                onPress={submitExpense}
                loading={saving}
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
  footerLoader: {
    paddingVertical: 18,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(30,43,34,0.38)",
  },
});
