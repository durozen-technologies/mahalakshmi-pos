import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Animated, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";

import type { FetchShopItemsParams } from "@/api/admin";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAdminItemsStore } from "@/store/admin-items-store";
import type {
  DailyPriceCreate,
  ItemPriceRead,
  ShopItemRead,
  UUID,
} from "@/types/api";
import { isNonNegativeNumber, toMoneyString } from "@/utils/decimal";
import type {
  AdminItemPricesScreenProps,
  AdminItemsCatalogueScreenProps,
  AdminShopItemsScreenProps,
} from "@/navigation/types";

import { getAdminPalette } from "./admin-dashboard-theme";
import {
  AdminItemEditorMode,
  AdminItemFilter,
  AdminItemFormScope,
  AdminItemWorkspace,
  ItemScope,
  PriceStatus,
} from "./admin-items-model";
import {
  EmptyState,
  ErrorState,
  FilterBar,
  ImportCatalogueModal,
  ItemList,
  ItemRow,
  PriceGrid,
  type PriceFilter,
  type RowAction,
  ShopPicker,
  StatsStrip,
  WorkspaceTabs,
} from "./components/admin-items-management";
import { ToastBanner } from "./components/admin-dashboard-primitives";
import {
  useAdminItemShops,
  useCatalogueItems,
  useShopItems,
  useShopPrices,
} from "./hooks/use-admin-items-data";
import { triggerHaptic, type ToastTone } from "./admin-dashboard-utils";

type ItemsRouteProps =
  | AdminItemsCatalogueScreenProps
  | AdminShopItemsScreenProps
  | AdminItemPricesScreenProps;

function buildShopItemQuery(filter: AdminItemFilter, search: string): FetchShopItemsParams {
  return {
    q: search.trim() || undefined,
    allocated: true,
    limit: 100,
  };
}

function buildCatalogueItemQuery(filter: AdminItemFilter, search: string): FetchShopItemsParams {
  return {
    q: search.trim() || undefined,
    limit: 100,
  };
}

function AdminItemsRoute({
  navigation,
  route,
  workspace,
}: ItemsRouteProps & { workspace: AdminItemWorkspace }) {
  const colorScheme = useColorScheme();
  const palette = useMemo(() => getAdminPalette(colorScheme), [colorScheme]);
  const insets = useSafeAreaInsets();
  const storedShopId = useAdminItemsStore((state) => state.selectedShopId);
  const setStoredShopId = useAdminItemsStore((state) => state.setSelectedShopId);
  const routeShopId = "params" in route ? route.params?.shopId : undefined;
  const initialShopId = routeShopId ?? storedShopId;
  const [selectedShopId, setSelectedShopId] = useState<UUID | null>(initialShopId ?? null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [importSearch, setImportSearch] = useState("");
  const debouncedImportSearch = useDebouncedValue(importSearch.trim(), 300);
  const [importOpen, setImportOpen] = useState(false);
  const [filter, setFilter] = useState(AdminItemFilter.All);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [toast, setToast] = useState<{ tone: ToastTone; message: string } | null>(null);
  const toastAnimation = useMemo(() => new Animated.Value(0), []);
  const shopsState = useAdminItemShops();
  const catalogueState = useCatalogueItems();
  const shopItemsState = useShopItems(selectedShopId);
  const importItemsState = useShopItems(selectedShopId);
  const priceState = useShopPrices(selectedShopId);

  const selectedShop = useMemo(
    () => shopsState.shops.find((shop) => shop.id === selectedShopId) ?? null,
    [selectedShopId, shopsState.shops],
  );

  const showToast = useCallback((tone: ToastTone, message: string) => {
    setToast({ tone, message });
  }, []);

  useEffect(() => {
    if (!toast) {
      toastAnimation.setValue(0);
      return;
    }
    Animated.timing(toastAnimation, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast, toastAnimation]);

  useEffect(() => {
    if (routeShopId && routeShopId !== selectedShopId) {
      setSelectedShopId(routeShopId);
      setStoredShopId(routeShopId);
    }
  }, [routeShopId, selectedShopId, setStoredShopId]);

  useEffect(() => {
    if (selectedShopId) {
      setStoredShopId(selectedShopId);
      return;
    }
    if (workspace !== AdminItemWorkspace.Catalogue && shopsState.shops[0]?.id) {
      setSelectedShopId(shopsState.shops[0].id);
    }
  }, [selectedShopId, setStoredShopId, shopsState.shops, workspace]);

  useEffect(() => {
    setFilter(AdminItemFilter.All);
    setPriceFilter("all");
  }, [workspace]);

  useEffect(() => {
    if (workspace === AdminItemWorkspace.Catalogue) {
      void catalogueState.load(buildCatalogueItemQuery(filter, debouncedSearch)).catch((error) => {
        showToast("error", error instanceof Error ? error.message : "Unable to load catalogue.");
      });
    }
  }, [catalogueState.load, debouncedSearch, filter, showToast, workspace]);

  useEffect(() => {
    if (workspace !== AdminItemWorkspace.Shop || !selectedShopId) {
      return;
    }
    void shopItemsState.load(buildShopItemQuery(filter, debouncedSearch)).catch((error) => {
      showToast("error", error instanceof Error ? error.message : "Unable to load shop items.");
    });
  }, [debouncedSearch, filter, selectedShopId, shopItemsState.load, showToast, workspace]);

  useEffect(() => {
    if (workspace !== AdminItemWorkspace.Shop || !selectedShopId || !importOpen) {
      return;
    }
    void importItemsState.load({
      q: debouncedImportSearch || undefined,
      scope: ItemScope.Global,
      allocated: false,
      limit: 100,
    }).catch((error) => {
      showToast("error", error instanceof Error ? error.message : "Unable to load catalogue items.");
    });
  }, [
    debouncedImportSearch,
    importItemsState.load,
    importOpen,
    selectedShopId,
    showToast,
    workspace,
  ]);

  const selectShop = useCallback((shopId: UUID) => {
    setStoredShopId(shopId);
    setSelectedShopId(shopId);
    setFilter(AdminItemFilter.All);
    setPriceFilter("all");
    setImportOpen(false);
    setImportSearch("");
  }, [setStoredShopId]);

  const navigateCreate = useCallback((scope: AdminItemFormScope) => {
    navigation.navigate("AdminItemEditor", {
      mode: AdminItemEditorMode.Create,
      workspace: scope === AdminItemFormScope.Catalogue ? AdminItemWorkspace.Catalogue : AdminItemWorkspace.Shop,
      shopId: selectedShopId ?? undefined,
    });
  }, [navigation, selectedShopId]);

  const navigateEdit = useCallback((item: ShopItemRead, forceCatalogue = false) => {
    const editingCatalogue = forceCatalogue || workspace === AdminItemWorkspace.Catalogue;
    navigation.navigate("AdminItemEditor", {
      mode:
        item.scope === ItemScope.Global && !editingCatalogue
          ? AdminItemEditorMode.Customize
          : AdminItemEditorMode.Edit,
      workspace: editingCatalogue ? AdminItemWorkspace.Catalogue : AdminItemWorkspace.Shop,
      itemId: item.id,
      shopId: selectedShopId ?? undefined,
    });
  }, [navigation, selectedShopId, workspace]);

  const navigatePrices = useCallback(() => {
    navigation.navigate("AdminItemPrices", { shopId: selectedShopId ?? undefined });
  }, [navigation, selectedShopId]);

  const confirmDelete = useCallback((item: ShopItemRead) => {
    if (workspace !== AdminItemWorkspace.Catalogue && item.scope === ItemScope.Global) {
      showToast("error", "Remove catalogue items from the shop instead of deleting the global record.");
      return;
    }
    Alert.alert(
      item.scope === ItemScope.Global ? "Delete catalogue item" : "Delete shop item",
      item.scope === ItemScope.Global
        ? `Delete ${item.name} from the catalogue? This is only allowed when it has no billing or price history.`
        : `Delete ${item.name}? Items with billing or price history cannot be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                if (workspace === AdminItemWorkspace.Catalogue) {
                  await catalogueState.deleteItem(item.id);
                } else {
                  await shopItemsState.deleteItem(item);
                }
                showToast("success", `${item.name} deleted.`);
              } catch (error) {
                showToast("error", error instanceof Error ? error.message : "Unable to delete item.");
              }
            })();
          },
        },
      ],
    );
  }, [catalogueState, shopItemsState, showToast, workspace]);

  const importCatalogueItem = useCallback((item: ShopItemRead) => {
    if (!selectedShopId) {
      triggerHaptic();
      showToast("error", "Select an import target shop first.");
      return;
    }

    void importItemsState.allocate(item.id)
      .then(() => {
        showToast("success", `${item.name} imported${selectedShop?.name ? ` to ${selectedShop.name}` : ""}.`);
        void shopItemsState.refresh().catch(() => undefined);
      })
      .catch((error) => showToast("error", error instanceof Error ? error.message : "Unable to import item."));
  }, [importItemsState, selectedShop?.name, selectedShopId, shopItemsState, showToast]);

  const itemActions = useCallback((item: ShopItemRead): { primary: RowAction; secondary: RowAction[] } => {
    const isCatalogueWorkspace = workspace === AdminItemWorkspace.Catalogue;
    const isGlobal = item.scope === ItemScope.Global;
    const primary: RowAction = isCatalogueWorkspace
      ? {
          label: "Edit",
          icon: "pencil-outline",
          onPress: () => navigateEdit(item),
        }
      : isGlobal
        ? {
            label: "Remove",
            icon: "link-variant-off",
            tone: "danger",
            disabled: !item.can_deallocate,
            onPress: () => {
              void shopItemsState.deallocate(item.id)
                .then(() => showToast("success", `${item.name} removed from shop.`))
                .catch((error) => showToast("error", error instanceof Error ? error.message : "Unable to remove item."));
            },
          }
        : {
            label: "Edit",
            icon: "pencil-outline",
          onPress: () => navigateEdit(item),
        };

    const secondary: RowAction[] = isCatalogueWorkspace
      ? [
          {
            label: "Import",
            icon: "tray-arrow-down",
            onPress: () => importCatalogueItem(item),
          },
        ]
      : [];

    return { primary, secondary };
  }, [importCatalogueItem, navigateEdit, shopItemsState, showToast, workspace]);

  const refreshCatalogue = useCallback(() => {
    void catalogueState.refresh().catch((error) => {
      showToast("error", error instanceof Error ? error.message : "Unable to refresh catalogue.");
    });
  }, [catalogueState, showToast]);

  const refreshShopItems = useCallback(() => {
    void shopsState.reload().catch(() => undefined);
    void shopItemsState.refresh().catch((error) => {
      showToast("error", error instanceof Error ? error.message : "Unable to refresh shop items.");
    });
  }, [shopItemsState, shopsState, showToast]);

  const refreshPrices = useCallback(() => {
    void priceState.load(true).catch((error) => {
      showToast("error", error instanceof Error ? error.message : "Unable to refresh prices.");
    });
  }, [priceState, showToast]);

  const refreshImportItems = useCallback(() => {
    void importItemsState.refresh().catch((error) => {
      showToast("error", error instanceof Error ? error.message : "Unable to refresh catalogue items.");
    });
  }, [importItemsState, showToast]);

  const savePriceRow = useCallback((item: ItemPriceRead, rawValue: string) => {
    if (!isNonNegativeNumber(rawValue)) {
      triggerHaptic();
      showToast("error", "Enter a valid price.");
      return;
    }
    void priceState.saveRow(item.item_id, toMoneyString(rawValue))
      .then(() => {
        showToast("success", `${item.item_name} price saved.`);
        void shopItemsState.refresh().catch(() => undefined);
      })
      .catch((error) => showToast("error", error instanceof Error ? error.message : "Unable to save price."));
  }, [priceState, shopItemsState, showToast]);

  const saveEditedPrices = useCallback((entries: DailyPriceCreate["entries"]) => {
    if (entries.length === 0) {
      showToast("error", "Edit at least one price before saving.");
      return;
    }
    if (entries.some((entry) => !isNonNegativeNumber(entry.price_per_unit))) {
      triggerHaptic();
      showToast("error", "Fix invalid edited prices before saving.");
      return;
    }
    void priceState.saveRows(entries)
      .then(() => {
        showToast("success", `${entries.length} price${entries.length === 1 ? "" : "s"} saved.`);
        void shopItemsState.refresh().catch(() => undefined);
      })
      .catch((error) => showToast("error", error instanceof Error ? error.message : "Unable to save edited prices."));
  }, [priceState, shopItemsState, showToast]);

  const completeTodayPrices = useCallback((entries: DailyPriceCreate["entries"], _staleCarryCount: number) => {
    if (entries.some((entry) => !isNonNegativeNumber(entry.price_per_unit))) {
      triggerHaptic();
      showToast("error", "Add valid prices before completing today.");
      return;
    }
    void priceState.saveAll(entries)
      .then(() => {
        showToast("success", "Today's prices completed.");
        void shopItemsState.refresh().catch(() => undefined);
      })
      .catch((error) => showToast("error", error instanceof Error ? error.message : "Unable to save prices."));
  }, [priceState, shopItemsState, showToast]);

  const commonHeader = (
    <YStack gap={10}>
      <ErrorState message={shopsState.error} palette={palette} onRetry={() => void shopsState.reload().catch(() => undefined)} />
      <WorkspaceTabs
        workspace={workspace}
        selectedShopId={selectedShopId}
        palette={palette}
        onCatalogue={() => navigation.navigate("AdminItemsCatalogue")}
        onShopItems={() => navigation.navigate("AdminShopItems", { shopId: selectedShopId ?? undefined })}
        onPrices={navigatePrices}
      />
      {workspace !== AdminItemWorkspace.Catalogue ? (
        <ShopPicker
          shops={shopsState.shops}
          selectedShop={selectedShop}
          loading={shopsState.loading}
          palette={palette}
          onSelectShop={selectShop}
        />
      ) : null}
    </YStack>
  );

  const renderCatalogue = () => (
    <ItemList
      items={catalogueState.items}
      loading={catalogueState.loading}
      refreshing={catalogueState.refreshing}
      loadingMore={catalogueState.loadingMore}
      hasMore={catalogueState.hasMore}
      palette={palette}
      bottomPadding={42 + insets.bottom}
      onRefresh={refreshCatalogue}
      onLoadMore={() => {
        void catalogueState.loadMore().catch((error) => {
          showToast("error", error instanceof Error ? error.message : "Unable to load more items.");
        });
      }}
      emptyTitle={search.trim() ? "No catalogue matches" : "No catalogue items yet"}
      emptyMessage={
        search.trim()
          ? "Clear search to see more catalogue items."
          : "Create the first global catalogue item to reuse across shops."
      }
      emptyAction={{
        label: "Add catalogue item",
        icon: "plus-circle-outline",
        onPress: () => navigateCreate(AdminItemFormScope.Catalogue),
      }}
      header={
        <YStack gap={12}>
          {commonHeader}
          <ErrorState message={catalogueState.error} palette={palette} onRetry={refreshCatalogue} />
          <StatsStrip counts={catalogueState.counts} totalCount={catalogueState.totalCount} palette={palette} />
          <ShopPicker
            shops={shopsState.shops}
            selectedShop={selectedShop}
            loading={shopsState.loading}
            palette={palette}
            eyebrow="Import target"
            sheetSubtitle="Choose the shop that should receive catalogue imports."
            onSelectShop={selectShop}
          />
          <FilterBar
            workspace={AdminItemWorkspace.Catalogue}
            search={search}
            filter={filter}
            counts={catalogueState.counts}
            palette={palette}
            onChangeSearch={setSearch}
            onChangeFilter={setFilter}
            onCreate={() => navigateCreate(AdminItemFormScope.Catalogue)}
          />
        </YStack>
      }
      renderItem={(item) => {
        const actions = itemActions(item);
        return (
          <ItemRow
            item={item}
            palette={palette}
            primaryAction={actions.primary}
            secondaryActions={actions.secondary}
          />
        );
      }}
    />
  );

  const renderShopItems = () => {
    if (!selectedShop) {
      return (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 42 + insets.bottom }]}
          style={{ backgroundColor: palette.background }}
        >
          {commonHeader}
          <EmptyState
            title="Select a shop"
            message="Choose a shop before selecting catalogue items."
            icon="store-alert-outline"
            palette={palette}
          />
        </ScrollView>
      );
    }
    return (
      <>
        <ItemList
          items={shopItemsState.items}
          loading={shopItemsState.loading}
          refreshing={shopItemsState.refreshing}
          loadingMore={shopItemsState.loadingMore}
          hasMore={shopItemsState.hasMore}
          palette={palette}
          bottomPadding={42 + insets.bottom}
          onRefresh={refreshShopItems}
          onLoadMore={() => {
            void shopItemsState.loadMore().catch((error) => {
              showToast("error", error instanceof Error ? error.message : "Unable to load more items.");
            });
          }}
          emptyTitle={search.trim() ? "No selected items match" : "No items selected"}
          emptyMessage={
            search.trim()
              ? "Clear search or import more catalogue items."
              : "Import catalogue items to make them available for this shop."
          }
          emptyAction={{
            label: "Import catalogue",
            icon: "tray-arrow-down",
            onPress: () => setImportOpen(true),
          }}
          header={
            <YStack gap={12}>
              {commonHeader}
              <ErrorState message={shopItemsState.error} palette={palette} onRetry={refreshShopItems} />
              <StatsStrip counts={shopItemsState.counts} totalCount={shopItemsState.totalCount} palette={palette} />
              <FilterBar
                workspace={AdminItemWorkspace.Shop}
                search={search}
                filter={filter}
                counts={shopItemsState.counts}
                palette={palette}
                onChangeSearch={setSearch}
                onChangeFilter={setFilter}
                onCreate={() => setImportOpen(true)}
              />
            </YStack>
          }
          renderItem={(item) => {
            const actions = itemActions(item);
            return (
              <ItemRow
                item={item}
                palette={palette}
                primaryAction={actions.primary}
                secondaryActions={actions.secondary}
              />
            );
          }}
        />
        <ImportCatalogueModal
          open={importOpen}
          items={importItemsState.items}
          loading={importItemsState.loading}
          refreshing={importItemsState.refreshing}
          loadingMore={importItemsState.loadingMore}
          hasMore={importItemsState.hasMore}
          search={importSearch}
          palette={palette}
          onClose={() => setImportOpen(false)}
          onChangeSearch={setImportSearch}
          onRefresh={refreshImportItems}
          onLoadMore={() => {
            void importItemsState.loadMore().catch((error) => {
              showToast("error", error instanceof Error ? error.message : "Unable to load more catalogue items.");
            });
          }}
          onImport={importCatalogueItem}
        />
      </>
    );
  };

  const renderPrices = () => {
    if (!selectedShop) {
      return (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 42 + insets.bottom }]}
          style={{ backgroundColor: palette.background }}
        >
          {commonHeader}
          <EmptyState
            title="Select a shop"
            message="Choose a shop before setting daily item prices."
            icon="store-alert-outline"
            palette={palette}
          />
        </ScrollView>
      );
    }
    return (
      <>
        <View style={[styles.fixedHeader, { backgroundColor: palette.background }]}>
          {commonHeader}
        </View>
        <PriceGrid
          items={priceState.bootstrap?.items ?? []}
          loading={priceState.loading}
          refreshing={priceState.refreshing}
          filter={priceFilter}
          draftPrices={priceState.draftPrices}
          savingAll={priceState.savingAll}
          savingItemId={priceState.savingItemId}
          error={priceState.error}
          selectedShop={selectedShop}
          palette={palette}
          bottomPadding={42 + insets.bottom}
          onRefresh={refreshPrices}
          onBackToItems={() => navigation.navigate("AdminShopItems", { shopId: selectedShop.id })}
          onChangeFilter={setPriceFilter}
          onChangeDraftPrice={priceState.setDraftPrice}
          onSaveRow={savePriceRow}
          onSaveEdited={saveEditedPrices}
          onCompleteToday={completeTodayPrices}
        />
      </>
    );
  };

  const title =
    workspace === AdminItemWorkspace.Catalogue
      ? "Catalogue"
      : workspace === AdminItemWorkspace.Prices
        ? "Prices"
        : "Shop items";
  const subtitle =
    workspace === AdminItemWorkspace.Catalogue
      ? "Global item workspace"
      : selectedShop?.name ?? "Choose a shop";

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]} edges={["top", "left", "right"]}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <View style={[styles.topBar, { borderBottomColor: palette.border, paddingTop: Math.max(insets.top - 8, 0) }]}>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate("AdminDashboard")} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={palette.textPrimary} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text numberOfLines={1} style={[styles.title, { color: palette.textPrimary }]}>
            {title}
          </Text>
          <Text numberOfLines={1} style={[styles.subtitle, { color: palette.textMuted }]}>
            {subtitle}
          </Text>
        </View>
      </View>
      {workspace === AdminItemWorkspace.Catalogue
        ? renderCatalogue()
        : workspace === AdminItemWorkspace.Prices
          ? renderPrices()
          : renderShopItems()}
      <ToastBanner toast={toast} palette={palette} animatedValue={toastAnimation} />
    </SafeAreaView>
  );
}

export function AdminItemsCatalogueScreen(props: AdminItemsCatalogueScreenProps) {
  return <AdminItemsRoute {...props} workspace={AdminItemWorkspace.Catalogue} />;
}

export function AdminShopItemsScreen(props: AdminShopItemsScreenProps) {
  return <AdminItemsRoute {...props} workspace={AdminItemWorkspace.Shop} />;
}

export function AdminItemPricesScreen(props: AdminItemPricesScreenProps) {
  return <AdminItemsRoute {...props} workspace={AdminItemWorkspace.Prices} />;
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
    gap: 12,
    paddingHorizontal: 16,
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
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  scrollContent: {
    gap: 12,
    padding: 14,
  },
  fixedHeader: {
    padding: 14,
    paddingBottom: 0,
  },
});
