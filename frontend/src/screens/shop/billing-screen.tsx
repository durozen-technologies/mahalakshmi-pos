import { useState } from "react";
import { Alert, Image, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CartActionBar } from "@/components/ui/cart-action-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Screen } from "@/components/ui/screen";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusPill } from "@/components/ui/status-pill";
import { TextField } from "@/components/ui/text-field";
import { useShopTranslation } from "@/hooks/use-shop-translation";
import { useShopBootstrap } from "@/hooks/use-shop-bootstrap";
import { BillingScreenProps } from "@/navigation/types";
import { CartItem, getCartTotal, useCartStore } from "@/store/cart-store";
import { cn } from "@/utils/cn";
import { money, toQuantityString } from "@/utils/decimal";
import { formatCurrency, formatUnit } from "@/utils/format";

const ITEM_IMAGES: Record<string, number> = {
  Chicken: require("../../asserts/chicken-with-skin.jpeg"),
  "Chicken without skin": require("../../asserts/chicken-without-skin.jpeg"),
  Duck: require("../../asserts/duck.jpeg"),
  "Country Chicken": require("../../asserts/country-chicken.jpeg"),
  "Live Country Chicken": require("../../asserts/live-country-chicken.jpg"),
  "Live Chicken": require("../../asserts/live-chicken.jpeg"),
  "Chicken Cleaning": require("../../asserts/chicken-cleaning.jpeg"),
};

const ITEM_DISPLAY_ORDER = [
  "Chicken",
  "Chicken without skin",
  "Country Chicken",
  "Duck",
  "Live Country Chicken",
  "Live Chicken",
  "Chicken Cleaning",
] as const;

const ITEM_DISPLAY_ORDER_INDEX = new Map<string, number>(
  ITEM_DISPLAY_ORDER.map((itemName, index) => [itemName, index]),
);

export function BillingScreen({ navigation }: BillingScreenProps) {
  const { bootstrap, loading, error, refresh } = useShopBootstrap();
  const { isTamil, t, translateItemName } = useShopTranslation();
  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const [quantities, setQuantities] = useState<Record<number, string>>({});

  function handleQuantityChange(itemId: number, value: string) {
    setQuantities((state) => ({ ...state, [itemId]: value }));
  }

  function handleAddToCart(item: NonNullable<typeof bootstrap>["items"][number]) {
    const rawQuantity = quantities[item.item_id]?.trim() ?? "";
    const itemName = translateItemName(item.item_name);

    if (!item.current_price) {
      Alert.alert(
        t("billing.alertPriceMissingTitle"),
        t("billing.alertPriceMissingMessage", { itemName }),
      );
      return;
    }

    if (!rawQuantity || money(rawQuantity).lessThanOrEqualTo(0)) {
      Alert.alert(
        t("billing.alertInvalidQuantityTitle"),
        t("billing.alertInvalidQuantityMessage", { itemName }),
      );
      return;
    }

    if (item.base_unit === "unit" && !money(rawQuantity).isInteger()) {
      Alert.alert(
        t("billing.alertInvalidQuantityTitle"),
        t("billing.alertInvalidUnitQuantityMessage", { itemName }),
      );
      return;
    }

    const cartLine: CartItem = {
      item_id: item.item_id,
      item_name: item.item_name,
      base_unit: item.base_unit,
      unit_type: item.unit_type,
      price_per_unit: item.current_price,
      quantity: item.base_unit === "unit" ? toQuantityString(rawQuantity, true) : rawQuantity,
    };

    addItem(cartLine);
    setQuantities((state) => ({ ...state, [item.item_id]: "" }));
  }

  const activeBootstrap = bootstrap;
  const orderedItems = activeBootstrap
    ? [...activeBootstrap.items].sort((left, right) => {
        const leftIndex = ITEM_DISPLAY_ORDER_INDEX.get(left.item_name) ?? Number.MAX_SAFE_INTEGER;
        const rightIndex = ITEM_DISPLAY_ORDER_INDEX.get(right.item_name) ?? Number.MAX_SAFE_INTEGER;

        if (leftIndex !== rightIndex) {
          return leftIndex - rightIndex;
        }

        return left.item_name.localeCompare(right.item_name);
      })
    : [];
  const previewTotal = formatCurrency(getCartTotal(cartItems));

  if (loading && !activeBootstrap) {
    return <LoadingState fullscreen label={t("billing.loadingPrices")} />;
  }

  if (!loading && !activeBootstrap && error) {
    return (
      <Screen>
        <EmptyState
          title={t("billing.unableToLoadShopData")}
          description={error}
        />
        <Button
          label={t("action.tryAgain")}
          onPress={() => void refresh()}
          className="self-start min-w-[150px]"
        />
      </Screen>
    );
  }

  if (activeBootstrap && !activeBootstrap.prices_set) {
    return (
      <Screen>
        <Card className="gap-5 overflow-hidden bg-card p-0">
          <View className="gap-5 rounded-[30px] bg-accent px-5 py-5">
            <Text
              className={cn(
                "font-semibold text-white/75",
                isTamil ? "text-xs leading-5 tracking-[0px]" : "text-[11px] uppercase tracking-[2.2px]",
              )}
            >
              {t("common.counterWorkspace")}
            </Text>
            <Text className="text-[30px] font-bold leading-[38px] text-white">{activeBootstrap.shop_name}</Text>
            <Text className={cn("text-sm text-white/85", isTamil ? "leading-7" : "leading-6")}>
              {t("billing.lockedDescription")}
            </Text>
          </View>
        </Card>

        <EmptyState
          title={t("billing.waitingAdminPriceSetup")}
          description={t("billing.waitingAdminPriceSetupDescription", { shopName: activeBootstrap.shop_name })}
        />
      </Screen>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <Screen>
        <SectionHeading
          eyebrow={t("billing.productGrid")}
          title={t("billing.addProductsTitle")}
          subtitle={t("billing.addProductsSubtitle")}
        />

        {orderedItems.map((item) => {
          const itemImage = ITEM_IMAGES[item.item_name];
          const itemName = translateItemName(item.item_name);

          return (
            <Card key={item.item_id} className="gap-4">
              <View className="flex-row items-start gap-4">
                {itemImage ? (
                  <Image
                    source={itemImage}
                    resizeMode="cover"
                    className="h-24 w-24 rounded-[24px] bg-surface"
                  />
                ) : null}
                <View className="flex-1 gap-3">
                  <View className="flex-row flex-wrap items-start justify-between gap-3">
                    <View className="flex-1 gap-1">
                      <Text className="text-lg font-semibold text-ink">{itemName}</Text>
                      <Text className="text-sm leading-6 text-muted">
                        {item.current_price ? formatCurrency(item.current_price) : t("common.pricePending")} / {formatUnit(item.base_unit)}
                      </Text>
                      <Text
                        className={cn(
                          "text-muted",
                          isTamil ? "text-xs leading-5 tracking-[0px]" : "text-[11px] uppercase tracking-[1.2px]",
                        )}
                      >
                        {item.base_unit === "kg" ? t("common.soldByWeight") : t("common.soldByUnit")}
                      </Text>
                    </View>
                    {/* <StatusPill
                      label={item.current_price ? t("billing.readyWithUnit", { unit: formatUnit(item.base_unit) }) : t("billing.priceMissing")}
                      tone={item.current_price ? "success" : "warning"}
                    /> */}
                  </View>
                  <TextField
                    label={item.base_unit === "kg" ? t("common.quantityKg") : t("common.quantityUnits")}
                    keyboardType="decimal-pad"
                    placeholder={item.base_unit === "kg" ? t("common.exampleKg") : t("common.exampleUnits")}
                    value={quantities[item.item_id] ?? ""}
                    onChangeText={(value) => handleQuantityChange(item.item_id, value)}
                  />
                  <Button
                    label={item.current_price ? t("action.addToCart") : t("action.awaitingPrice")}
                    onPress={() => handleAddToCart(item)}
                    disabled={!item.current_price}
                    className="self-start min-w-[150px]"
                  />
                </View>
              </View>
            </Card>
          );
        })}

        <SectionHeading
          eyebrow={t("billing.currentCart")}
          title={t("billing.reviewBeforeCheckout")}
          subtitle={t("billing.reviewBeforeCheckoutSubtitle")}
        />
        {cartItems.length === 0 ? (
          <EmptyState
            title={t("billing.cartEmpty")}
            description={t("billing.cartEmptyDescription")}
          />
        ) : (
          cartItems.map((item) => (
            <Card key={item.item_id} className="gap-4">
              <View className="flex-row flex-wrap items-start justify-between gap-3">
                <View className="flex-1 gap-1">
                  <Text className="text-base font-semibold text-ink">{translateItemName(item.item_name)}</Text>
                  <Text className="text-sm leading-6 text-muted">
                    {item.quantity} {formatUnit(item.base_unit)} x {formatCurrency(item.price_per_unit)}
                  </Text>
                </View>
                <View className="items-end gap-2">
                  <StatusPill label={formatUnit(item.base_unit)} tone="neutral" />
                  <Text className="text-base font-bold text-ink">
                    {formatCurrency(money(item.quantity).mul(money(item.price_per_unit)).toFixed(2))}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between rounded-[22px] bg-surface px-4 py-3">
                <Text className="text-sm text-muted">{t("billing.removeLine")}</Text>
                <Button
                  label={t("action.remove")}
                  onPress={() => removeItem(item.item_id)}
                  variant="secondary"
                  size="sm"
                />
              </View>
            </Card>
          ))
        )}
      </Screen>

      <CartActionBar
        total={previewTotal}
        label={cartItems.length === 0 ? t("action.addItemsFirst") : t("action.proceedToCheckout")}
        disabled={cartItems.length === 0}
        onPress={() => navigation.navigate("Checkout")}
      />
    </View>
  );
}
