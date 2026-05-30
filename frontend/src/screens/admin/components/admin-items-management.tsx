import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button as TButton, Input, Spinner, XStack, YStack } from "tamagui";

import { resolveApiUrl } from "@/api/client";
import type {
  DailyPriceCreate,
  ItemPriceRead,
  PriceStatus as ApiPriceStatus,
  ShopItemCounts,
  ShopItemRead,
  ShopRead,
  UUID,
} from "@/types/api";
import { isNonNegativeNumber, toMoneyString } from "@/utils/decimal";

import { adminShadow, type ThemePalette } from "../admin-dashboard-theme";
import {
  AdminItemFilter,
  AdminItemWorkspace,
  ItemScope,
  PriceStatus,
} from "../admin-items-model";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export type RowAction = {
  label: string;
  icon: IconName;
  tone?: "primary" | "neutral" | "danger";
  disabled?: boolean;
  onPress: () => void;
};

export type PriceFilter = "all" | ApiPriceStatus;

const CATALOGUE_FILTERS = [
  AdminItemFilter.All,
  AdminItemFilter.Allocated,
  AdminItemFilter.Available,
  AdminItemFilter.Paused,
];

const SHOP_FILTERS = [
  AdminItemFilter.All,
  AdminItemFilter.Allocated,
  AdminItemFilter.Available,
  AdminItemFilter.Catalogue,
  AdminItemFilter.Shop,
  AdminItemFilter.NeedsPrice,
  AdminItemFilter.StalePrice,
  AdminItemFilter.Priced,
  AdminItemFilter.Paused,
];

const FILTER_META: Record<AdminItemFilter, { label: string; icon: IconName; countKey?: keyof ShopItemCounts }> = {
  [AdminItemFilter.All]: { label: "All", icon: "format-list-bulleted", countKey: "all" },
  [AdminItemFilter.Allocated]: { label: "Allocated", icon: "link-variant", countKey: "allocated" },
  [AdminItemFilter.Available]: { label: "Available", icon: "link-variant-off", countKey: "available" },
  [AdminItemFilter.Catalogue]: { label: "Catalogue", icon: "shape-outline", countKey: "catalogue" },
  [AdminItemFilter.Shop]: { label: "Shop", icon: "storefront-outline", countKey: "shop" },
  [AdminItemFilter.Priced]: { label: "Priced", icon: "cash-check", countKey: "priced" },
  [AdminItemFilter.NeedsPrice]: { label: "Needs price", icon: "cash-clock", countKey: "needs_price" },
  [AdminItemFilter.StalePrice]: { label: "Stale", icon: "calendar-alert", countKey: "stale_price" },
  [AdminItemFilter.Paused]: { label: "Paused", icon: "pause-circle-outline", countKey: "paused" },
};

const PRICE_FILTERS: { value: PriceFilter; label: string; icon: IconName }[] = [
  { value: "all", label: "All", icon: "format-list-bulleted" },
  { value: PriceStatus.Missing, label: "Missing", icon: "cash-clock" },
  { value: PriceStatus.Stale, label: "Stale", icon: "calendar-alert" },
  { value: PriceStatus.Current, label: "Current", icon: "cash-check" },
];

function priceStatusFor(item: ItemPriceRead): ApiPriceStatus {
  return item.price_status ?? (item.latest_price_date ? PriceStatus.Stale : PriceStatus.Missing);
}

function priceStatusTone(status: ApiPriceStatus): "primary" | "neutral" | "danger" {
  if (status === PriceStatus.Current) {
    return "primary";
  }
  if (status === PriceStatus.Stale) {
    return "danger";
  }
  return "neutral";
}

function buttonColors(palette: ThemePalette, tone: "primary" | "neutral" | "danger" = "neutral", active = false) {
  if (tone === "danger") {
    return {
      fg: palette.danger,
      bg: active ? palette.dangerSoft : palette.card,
      border: palette.danger,
    };
  }
  if (tone === "primary") {
    return {
      fg: active ? "#FFFFFF" : palette.emeraldDark,
      bg: active ? palette.emerald : palette.emeraldSoft,
      border: palette.emerald,
    };
  }
  return {
    fg: palette.textPrimary,
    bg: palette.card,
    border: palette.border,
  };
}

function ActionButton({
  label,
  icon,
  palette,
  tone = "neutral",
  active = false,
  disabled = false,
  loading = false,
  compact = false,
  onPress,
}: {
  label: string;
  icon: IconName;
  palette: ThemePalette;
  tone?: "primary" | "neutral" | "danger";
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  onPress: () => void;
}) {
  const colors = buttonColors(palette, tone, active || tone === "primary");
  return (
    <TButton
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      minHeight={compact ? 36 : 42}
      borderRadius={10}
      paddingHorizontal={compact ? 9 : 12}
      borderWidth={1}
      borderColor={colors.border}
      backgroundColor={colors.bg}
      opacity={disabled ? 0.55 : 1}
      pressStyle={{ opacity: 0.9, scale: 0.99 }}
    >
      {loading ? (
        <Spinner color={colors.fg} size="small" />
      ) : (
        <XStack alignItems="center" justifyContent="center" gap={6}>
          <MaterialCommunityIcons name={icon} size={compact ? 15 : 17} color={colors.fg} />
          <Text numberOfLines={1} style={[styles.buttonText, { color: colors.fg }]}>
            {label}
          </Text>
        </XStack>
      )}
    </TButton>
  );
}

export function StatusPill({
  label,
  icon,
  palette,
  tone = "neutral",
}: {
  label: string;
  icon?: IconName;
  palette: ThemePalette;
  tone?: "primary" | "neutral" | "danger";
}) {
  const colors = buttonColors(palette, tone, false);
  return (
    <View style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.bg }]}>
      {icon ? <MaterialCommunityIcons name={icon} size={13} color={colors.fg} /> : null}
      <Text numberOfLines={1} style={[styles.pillText, { color: colors.fg }]}>
        {label}
      </Text>
    </View>
  );
}

export function EmptyState({
  title,
  message,
  icon,
  action,
  palette,
}: {
  title: string;
  message: string;
  icon: IconName;
  action?: RowAction;
  palette: ThemePalette;
}) {
  return (
    <View style={[styles.empty, { borderColor: palette.border, backgroundColor: palette.card }]}>
      <View style={[styles.emptyIcon, { backgroundColor: palette.surfaceMuted }]}>
        <MaterialCommunityIcons name={icon} size={28} color={palette.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>{title}</Text>
      <Text style={[styles.emptyText, { color: palette.textMuted }]}>{message}</Text>
      {action ? (
        <ActionButton
          label={action.label}
          icon={action.icon}
          palette={palette}
          tone={action.tone ?? "primary"}
          onPress={action.onPress}
        />
      ) : null}
    </View>
  );
}

export function ErrorState({
  message,
  palette,
  onRetry,
}: {
  message: string | null;
  palette: ThemePalette;
  onRetry?: () => void;
}) {
  if (!message) {
    return null;
  }
  return (
    <View style={[styles.error, { borderColor: palette.danger, backgroundColor: palette.dangerSoft }]}>
      <MaterialCommunityIcons name="alert-circle-outline" size={18} color={palette.danger} />
      <Text style={[styles.errorText, { color: palette.danger }]}>{message}</Text>
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} hitSlop={10}>
          <Text style={[styles.errorAction, { color: palette.danger }]}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function WorkspaceTabs({
  workspace,
  selectedShopId,
  palette,
  onCatalogue,
  onShopItems,
  onPrices,
}: {
  workspace: AdminItemWorkspace;
  selectedShopId: UUID | null;
  palette: ThemePalette;
  onCatalogue: () => void;
  onShopItems: () => void;
  onPrices: () => void;
}) {
  const items: { value: AdminItemWorkspace; label: string; icon: IconName; onPress: () => void }[] = [
    { value: AdminItemWorkspace.Catalogue, label: "Catalogue", icon: "shape-outline", onPress: onCatalogue },
    { value: AdminItemWorkspace.Shop, label: "Shop items", icon: "storefront-outline", onPress: onShopItems },
    { value: AdminItemWorkspace.Prices, label: "Prices", icon: "cash-edit", onPress: onPrices },
  ];
  return (
    <View style={[styles.tabs, { borderColor: palette.border, backgroundColor: palette.surfaceMuted }]}>
      {items.map((item) => {
        const active = item.value === workspace;
        const disabled = item.value !== AdminItemWorkspace.Catalogue && !selectedShopId;
        return (
          <Pressable
            key={item.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled }}
            disabled={disabled}
            onPress={item.onPress}
            style={[
              styles.tab,
              {
                backgroundColor: active ? palette.card : "transparent",
                opacity: disabled ? 0.5 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={16}
              color={active ? palette.emeraldDark : palette.textMuted}
            />
            <Text
              numberOfLines={1}
              style={[styles.tabText, { color: active ? palette.emeraldDark : palette.textMuted }]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ShopPicker({
  shops,
  selectedShop,
  loading,
  palette,
  eyebrow = "Active shop",
  sheetSubtitle = "Search and switch the active item workspace.",
  onSelectShop,
}: {
  shops: ShopRead[];
  selectedShop: ShopRead | null;
  loading: boolean;
  palette: ThemePalette;
  eyebrow?: string;
  sheetSubtitle?: string;
  onSelectShop: (shopId: UUID) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filteredShops = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return shops;
    }
    return shops.filter((shop) => shop.name.toLowerCase().includes(normalized));
  }, [query, shops]);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={[styles.shopPicker, { borderColor: palette.border, backgroundColor: palette.card }]}
      >
        <View style={styles.shopPickerText}>
          <Text style={[styles.eyebrow, { color: palette.textMuted }]}>{eyebrow}</Text>
          <Text numberOfLines={1} style={[styles.shopName, { color: palette.textPrimary }]}>
            {loading ? "Loading shops..." : selectedShop?.name ?? "Select a shop"}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-down" size={22} color={palette.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={[styles.modalOverlay, styles.centeredModalOverlay, { backgroundColor: palette.overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={[styles.shopSheet, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <XStack alignItems="center" justifyContent="space-between" gap={10}>
              <YStack flex={1} minWidth={0}>
                <Text style={[styles.sheetTitle, { color: palette.textPrimary }]}>Select shop</Text>
                <Text style={[styles.sheetSubtitle, { color: palette.textMuted }]}>
                  {sheetSubtitle}
                </Text>
              </YStack>
              <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={styles.iconButton}>
                <MaterialCommunityIcons name="close" size={20} color={palette.textPrimary} />
              </Pressable>
            </XStack>
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="Search shops"
              placeholderTextColor={palette.textMuted as never}
              minHeight={44}
              borderRadius={10}
              borderWidth={1}
              borderColor={palette.border}
              backgroundColor={palette.surfaceMuted}
              color={palette.textPrimary}
              fontSize={14}
              fontWeight="700"
            />
            <FlatList
              data={filteredShops}
              keyExtractor={(shop) => shop.id}
              style={{ maxHeight: 360 }}
              ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
              renderItem={({ item }) => {
                const selected = item.id === selectedShop?.id;
                return (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      onSelectShop(item.id);
                      setOpen(false);
                    }}
                    style={[
                      styles.shopOption,
                      {
                        borderColor: selected ? palette.emerald : palette.border,
                        backgroundColor: selected ? palette.emeraldSoft : palette.surfaceMuted,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={selected ? "store-check-outline" : "storefront-outline"}
                      size={18}
                      color={selected ? palette.emeraldDark : palette.textSecondary}
                    />
                    <Text numberOfLines={1} style={[styles.shopOptionText, { color: palette.textPrimary }]}>
                      {item.name}
                    </Text>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <EmptyState
                  title="No shops found"
                  message="Change the search text or create a shop first."
                  icon="store-search-outline"
                  palette={palette}
                />
              }
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

export function FilterBar({
  workspace,
  search,
  filter,
  counts,
  palette,
  onChangeSearch,
  onChangeFilter,
  onCreate,
}: {
  workspace: AdminItemWorkspace.Catalogue | AdminItemWorkspace.Shop;
  search: string;
  filter: AdminItemFilter;
  counts: ShopItemCounts | null;
  palette: ThemePalette;
  onChangeSearch: (value: string) => void;
  onChangeFilter: (value: AdminItemFilter) => void;
  onCreate: () => void;
}) {
  return (
    <YStack gap={10}>
      <XStack gap={8} alignItems="center">
        <View style={[styles.searchWrap, { borderColor: palette.border, backgroundColor: palette.card }]}>
          <MaterialCommunityIcons name="magnify" size={18} color={palette.textMuted} />
          <Input
            value={search}
            onChangeText={onChangeSearch}
            placeholder="Search English or Tamil"
            placeholderTextColor={palette.textMuted as never}
            flex={1}
            borderWidth={0}
            paddingHorizontal={0}
            backgroundColor="transparent"
            color={palette.textPrimary}
            fontSize={14}
            fontWeight="700"
          />
        </View>
        <ActionButton
          label={workspace === AdminItemWorkspace.Catalogue ? "Add" : "Import"}
          icon={workspace === AdminItemWorkspace.Catalogue ? "plus" : "tray-arrow-down"}
          palette={palette}
          tone="primary"
          onPress={onCreate}
        />
      </XStack>
    </YStack>
  );
}

export function StatsStrip({
  counts,
  totalCount,
  palette,
}: {
  counts: ShopItemCounts | null;
  totalCount: number;
  palette: ThemePalette;
}) {
  const stats = [
    { label: "Total", value: totalCount || counts?.all || 0, icon: "format-list-bulleted" as IconName, tone: "primary" as const },
  ];
  return (
    <View style={styles.statsStrip}>
      {stats.map((stat) => {
        const colors = buttonColors(palette, stat.tone, false);
        return (
          <View
            key={stat.label}
            style={[styles.statCell, { borderColor: colors.border, backgroundColor: colors.bg }]}
          >
            <MaterialCommunityIcons name={stat.icon} size={15} color={colors.fg} />
            <Text style={[styles.statValue, { color: palette.textPrimary }]}>{stat.value}</Text>
            <Text numberOfLines={1} style={[styles.statLabel, { color: palette.textMuted }]}>
              {stat.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function ItemRow({
  item,
  palette,
  primaryAction,
  secondaryActions,
}: {
  item: ShopItemRead;
  palette: ThemePalette;
  primaryAction: RowAction;
  secondaryActions: RowAction[];
}) {
  const imageUri = item.image_path ? resolveApiUrl(item.image_path) : "";
  const unitLabel = `${item.unit_type === "weight" ? "Weight" : "Count"} · ${item.base_unit.toUpperCase()}`;
  const categoryLabel = item.category?.trim() ? item.category.trim() : "Uncategorized";

  return (
    <View style={[styles.itemRow, { borderColor: palette.border, backgroundColor: palette.card }]}>
      <View style={styles.itemMain}>
        <View style={[styles.thumb, { backgroundColor: palette.surfaceMuted }]}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} contentFit="cover" style={StyleSheet.absoluteFill} />
          ) : (
            <MaterialCommunityIcons name="image-outline" size={19} color={palette.textMuted} />
          )}
        </View>
        <View style={styles.itemText}>
          <Text style={[styles.itemName, { color: palette.textPrimary }]}>
            {item.name}
          </Text>
          <Text style={[styles.itemTamilName, { color: palette.textSecondary }]}>
            {item.tamil_name || "Tamil missing"}
          </Text>
          <Text style={[styles.itemMeta, { color: palette.textMuted }]}>
            {unitLabel} · {categoryLabel}
          </Text>
        </View>
      </View>
      <View style={styles.rowActions}>
        {secondaryActions.map((action) => (
          <ActionButton
            key={action.label}
            label={action.label}
            icon={action.icon}
            palette={palette}
            tone={action.tone ?? "neutral"}
            disabled={action.disabled}
            onPress={action.onPress}
            compact
          />
        ))}
        <ActionButton
          label={primaryAction.label}
          icon={primaryAction.icon}
          palette={palette}
          tone={primaryAction.tone ?? "primary"}
          disabled={primaryAction.disabled}
          onPress={primaryAction.onPress}
          compact
        />
      </View>
    </View>
  );
}

export function ItemList({
  items,
  loading,
  refreshing,
  loadingMore,
  hasMore,
  emptyTitle,
  emptyMessage,
  emptyAction,
  palette,
  onRefresh,
  onLoadMore,
  renderItem,
  header,
  bottomPadding,
}: {
  items: ShopItemRead[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  emptyTitle: string;
  emptyMessage: string;
  emptyAction?: RowAction;
  palette: ThemePalette;
  onRefresh: () => void;
  onLoadMore: () => void;
  renderItem: (item: ShopItemRead) => React.ReactElement;
  header: React.ReactElement;
  bottomPadding: number;
}) {
  return (
    <FlatList
      data={loading && items.length === 0 ? [] : items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => renderItem(item)}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 14, paddingBottom: bottomPadding, gap: 10 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.emerald} />}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={<View style={styles.listHeader}>{header}</View>}
      ListEmptyComponent={
        loading ? (
          <YStack gap={8}>
            <LoadingRow palette={palette} />
            <LoadingRow palette={palette} />
            <LoadingRow palette={palette} />
          </YStack>
        ) : (
          <EmptyState
            title={emptyTitle}
            message={emptyMessage}
            icon="playlist-remove"
            action={emptyAction}
            palette={palette}
          />
        )
      }
      ListFooterComponent={
        hasMore ? (
          <ActionButton
            label="Load more"
            icon="chevron-down-circle-outline"
            palette={palette}
            tone="neutral"
            loading={loadingMore}
            onPress={onLoadMore}
          />
        ) : null
      }
    />
  );
}

function LoadingRow({ palette }: { palette: ThemePalette }) {
  return (
    <View style={[styles.loadingRow, { borderColor: palette.border, backgroundColor: palette.card }]}>
      <View style={[styles.loadingThumb, { backgroundColor: palette.surfaceMuted }]} />
      <YStack flex={1} gap={8}>
        <View style={[styles.loadingLineWide, { backgroundColor: palette.surfaceMuted }]} />
        <View style={[styles.loadingLineNarrow, { backgroundColor: palette.surfaceMuted }]} />
      </YStack>
      <View style={[styles.loadingButton, { backgroundColor: palette.surfaceMuted }]} />
    </View>
  );
}

export function PriceGrid({
  items,
  loading,
  refreshing,
  filter,
  draftPrices,
  savingAll,
  savingItemId,
  error,
  selectedShop,
  palette,
  bottomPadding,
  onRefresh,
  onBackToItems,
  onChangeFilter,
  onChangeDraftPrice,
  onSaveRow,
  onSaveEdited,
  onCompleteToday,
}: {
  items: ItemPriceRead[];
  loading: boolean;
  refreshing: boolean;
  filter: PriceFilter;
  draftPrices: Record<UUID, string>;
  savingAll: boolean;
  savingItemId: UUID | null;
  error: string | null;
  selectedShop: ShopRead | null;
  palette: ThemePalette;
  bottomPadding: number;
  onRefresh: () => void;
  onBackToItems: () => void;
  onChangeFilter: (filter: PriceFilter) => void;
  onChangeDraftPrice: (itemId: UUID, value: string) => void;
  onSaveRow: (item: ItemPriceRead, value: string) => void;
  onSaveEdited: (entries: DailyPriceCreate["entries"]) => void;
  onCompleteToday: (entries: DailyPriceCreate["entries"], staleCarryCount: number) => void;
}) {
  const entries = items.map((item) => ({
    item_id: item.item_id,
    price_per_unit: toMoneyString(draftPrices[item.item_id] ?? item.current_price ?? "0"),
  }));
  const dirtyItems = items.filter((item) => {
    const draftValue = draftPrices[item.item_id];
    return draftValue !== undefined && draftValue !== (item.current_price ?? "");
  });
  const dirtyEntries = dirtyItems.map((item) => ({
    item_id: item.item_id,
    price_per_unit: toMoneyString(draftPrices[item.item_id] ?? ""),
  }));
  const invalidCount = items.filter(
    (item) => !isNonNegativeNumber(draftPrices[item.item_id] ?? item.current_price ?? "0"),
  ).length;
  const invalidDirtyCount = dirtyItems.filter(
    (item) => !isNonNegativeNumber(draftPrices[item.item_id] ?? ""),
  ).length;
  const dirtyCount = dirtyEntries.length;

  const completeToday = () => {
    onCompleteToday(entries, 0);
  };

  return (
      <FlatList
        data={loading ? [] : items}
        keyExtractor={(item) => item.item_id}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        style={{ flex: 1, backgroundColor: palette.background }}
        contentContainerStyle={{ padding: 14, paddingBottom: bottomPadding, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.emerald} />}
        ListHeaderComponent={
          <YStack gap={12} marginBottom={4}>
            <ErrorState message={error} palette={palette} onRetry={onRefresh} />
            <View style={[styles.priceSummary, { borderColor: palette.border, backgroundColor: palette.card }]}>
              <XStack alignItems="center" justifyContent="space-between" gap={10}>
                <YStack flex={1} minWidth={0}>
                  <Text numberOfLines={1} style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                    Daily prices
                  </Text>
                  <Text numberOfLines={1} style={[styles.sectionSubtitle, { color: palette.textMuted }]}>
                    {selectedShop?.name ?? "Select a shop"} · {items.length} items · {dirtyCount} unsaved
                  </Text>
                </YStack>
                <ActionButton
                  label="Items"
                  icon="arrow-left"
                  palette={palette}
                  tone="neutral"
                  onPress={onBackToItems}
                  compact
                />
              </XStack>
              <XStack gap={8} flexWrap="wrap">
                <ActionButton
                  label={savingAll ? "Saving..." : "Save edited prices"}
                  icon="content-save-outline"
                  palette={palette}
                  tone="primary"
                  loading={savingAll}
                  disabled={dirtyCount === 0 || invalidDirtyCount > 0}
                  onPress={() => onSaveEdited(dirtyEntries)}
                />
                <ActionButton
                  label="Complete today"
                  icon="calendar-check-outline"
                  palette={palette}
                  tone="neutral"
                  disabled={items.length === 0 || invalidCount > 0}
                  onPress={completeToday}
                />
              </XStack>
            </View>
          </YStack>
        }
      renderItem={({ item }) => {
        const draftValue = draftPrices[item.item_id];
        const currentValue = item.current_price ?? "";
        const value = draftValue ?? currentValue;
        const dirty = draftValue !== undefined && draftValue !== currentValue;
        const valid = isNonNegativeNumber(value);
        const imageUri = item.image_path ? resolveApiUrl(item.image_path) : "";
        return (
          <View style={[styles.priceRow, { borderColor: palette.border, backgroundColor: palette.card }]}>
            <View style={[styles.thumb, { backgroundColor: palette.surfaceMuted }]}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} contentFit="cover" style={StyleSheet.absoluteFill} />
              ) : (
                <MaterialCommunityIcons name="image-outline" size={19} color={palette.textMuted} />
              )}
            </View>
            <View style={styles.priceText}>
              <Text style={[styles.itemName, { color: palette.textPrimary }]}>
                {item.item_name}
              </Text>
              <Text style={[styles.itemTamilName, { color: palette.textSecondary }]}>
                {item.item_tamil_name ?? "Tamil missing"}
              </Text>
              <Text style={[styles.itemMeta, { color: palette.textMuted }]}>
                {item.base_unit.toUpperCase()}
              </Text>
            </View>
            <View style={styles.priceEdit}>
              <Input
                value={value}
                onChangeText={(nextValue) => onChangeDraftPrice(item.item_id, nextValue)}
                placeholder="0.00"
                placeholderTextColor={palette.textMuted as never}
                keyboardType="decimal-pad"
                minHeight={40}
                borderRadius={10}
                borderWidth={1}
                borderColor={valid || !value ? palette.border : palette.danger}
                backgroundColor={palette.surfaceMuted}
                color={palette.textPrimary}
                fontSize={15}
                fontWeight="900"
                textAlign="right"
              />
              <ActionButton
                label="Save"
                icon="cash-check"
                palette={palette}
                tone={dirty ? "primary" : "neutral"}
                compact
                disabled={!valid || !dirty}
                loading={savingItemId === item.item_id}
                onPress={() => onSaveRow(item, value)}
              />
            </View>
          </View>
        );
      }}
      ListEmptyComponent={
        loading ? (
          <YStack gap={8}>
            <LoadingRow palette={palette} />
            <LoadingRow palette={palette} />
            <LoadingRow palette={palette} />
          </YStack>
        ) : (
          <EmptyState
            title={items.length === 0 ? "No allocated items" : "No prices match"}
            message={
              items.length === 0
                ? "Allocate items to this shop before setting daily prices."
                : "Refresh the page to check the latest prices."
            }
            icon={items.length === 0 ? "link-variant-off" : "cash-clock"}
            action={items.length === 0 ? { label: "Back to items", icon: "arrow-left", onPress: onBackToItems } : undefined}
            palette={palette}
          />
        )
      }
      />
  );
}

export function ImportCatalogueModal({
  open,
  items,
  loading,
  refreshing,
  loadingMore,
  hasMore,
  search,
  palette,
  onClose,
  onChangeSearch,
  onRefresh,
  onLoadMore,
  onImport,
}: {
  open: boolean;
  items: ShopItemRead[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  search: string;
  palette: ThemePalette;
  onClose: () => void;
  onChangeSearch: (value: string) => void;
  onRefresh: () => void;
  onLoadMore: () => void;
  onImport: (item: ShopItemRead) => void;
}) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.modalOverlay, styles.centeredModalOverlay, { backgroundColor: palette.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.importSheet, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <XStack alignItems="center" justifyContent="space-between" gap={10}>
            <YStack flex={1} minWidth={0}>
              <Text style={[styles.sheetTitle, { color: palette.textPrimary }]}>Import catalogue items</Text>
              <Text style={[styles.sheetSubtitle, { color: palette.textMuted }]}>
                Select global catalogue items for this shop.
              </Text>
            </YStack>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.iconButton}>
              <MaterialCommunityIcons name="close" size={20} color={palette.textPrimary} />
            </Pressable>
          </XStack>
          <View style={[styles.searchWrap, { borderColor: palette.border, backgroundColor: palette.surfaceMuted }]}>
            <MaterialCommunityIcons name="magnify" size={18} color={palette.textMuted} />
            <Input
              value={search}
              onChangeText={onChangeSearch}
              placeholder="Search catalogue"
              placeholderTextColor={palette.textMuted as never}
              flex={1}
              borderWidth={0}
              paddingHorizontal={0}
              backgroundColor="transparent"
              color={palette.textPrimary}
              fontSize={14}
              fontWeight="700"
            />
          </View>
          <FlatList
            data={loading ? [] : items}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.emerald} />}
            renderItem={({ item }) => (
              <ItemRow
                item={item}
                palette={palette}
                primaryAction={{
                  label: "Import",
                  icon: "tray-arrow-down",
                  onPress: () => onImport(item),
                }}
                secondaryActions={[]}
              />
            )}
            ListEmptyComponent={
              loading ? (
                <YStack gap={8}>
                  <LoadingRow palette={palette} />
                  <LoadingRow palette={palette} />
                </YStack>
              ) : (
                <EmptyState
                  title="No catalogue items"
                  message="All matching catalogue items are already selected for this shop."
                  icon="playlist-check"
                  palette={palette}
                />
              )
            }
            ListFooterComponent={
              hasMore ? (
                <ActionButton
                  label="Load more"
                  icon="chevron-down-circle-outline"
                  palette={palette}
                  tone="neutral"
                  loading={loadingMore}
                  onPress={onLoadMore}
                />
              ) : null
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  buttonText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
    flexShrink: 1,
  },
  empty: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    gap: 10,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  error: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },
  errorAction: {
    fontSize: 12,
    fontWeight: "900",
  },
  tabs: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    flexDirection: "row",
    gap: 4,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 6,
  },
  tabText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
    flexShrink: 1,
  },
  shopPicker: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  shopPickerText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  eyebrow: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  shopName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 12,
  },
  centeredModalOverlay: {
    justifyContent: "center",
  },
  shopSheet: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    ...adminShadow("#000000", 0.22, 18, 18),
  },
  importSheet: {
    flex: 1,
    width: "100%",
    maxHeight: "86%",
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    ...adminShadow("#000000", 0.22, 18, 18),
  },
  actionSheet: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    maxHeight: "82%",
    ...adminShadow("#000000", 0.22, 18, 18),
  },
  actionSheetScroll: {
    flexGrow: 0,
    maxHeight: 360,
  },
  actionSheetContent: {
    gap: 8,
  },
  actionSheetOption: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionSheetOptionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
  },
  actionSheetEmpty: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  actionSheetCancel: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionSheetCancelText: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
  },
  confirmIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
  },
  sheetSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  shopOption: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  shopOptionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
  },
  searchWrap: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 11,
    paddingRight: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  filterScroll: {
    gap: 7,
    paddingRight: 8,
  },
  filterChip: {
    minHeight: 34,
    maxWidth: 148,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  filterText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
    flexShrink: 1,
  },
  filterCount: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "900",
  },
  statsStrip: {
    flexDirection: "row",
    gap: 8,
  },
  statCell: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: 12,
    padding: 9,
    gap: 3,
  },
  statValue: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  itemRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  itemMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  rowActions: {
    minWidth: 84,
    gap: 6,
    alignItems: "stretch",
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
  },
  itemTamilName: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },
  itemMeta: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
  },
  pill: {
    maxWidth: 168,
    minHeight: 24,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pillText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "900",
    flexShrink: 1,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  listHeader: {
    marginBottom: 4,
  },
  loadingRow: {
    minHeight: 68,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  loadingLineWide: {
    width: "68%",
    height: 14,
    borderRadius: 99,
  },
  loadingLineNarrow: {
    width: "48%",
    height: 11,
    borderRadius: 99,
  },
  loadingButton: {
    width: 72,
    height: 32,
    borderRadius: 10,
  },
  priceSummary: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
  },
  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  priceRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  priceText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  priceEdit: {
    width: 116,
    gap: 6,
  },
});
