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
import { useShopBootstrap } from "@/hooks/use-shop-bootstrap";
import { BillingScreenProps } from "@/navigation/types";
import { CartItem, getCartTotal, useCartStore } from "@/store/cart-store";
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

export function BillingScreen({ navigation }: BillingScreenProps) {
  const { bootstrap, loading } = useShopBootstrap();
  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const [quantities, setQuantities] = useState<Record<number, string>>({});

  function handleQuantityChange(itemId: number, value: string) {
    setQuantities((state) => ({ ...state, [itemId]: value }));
  }

  function handleAddToCart(item: NonNullable<typeof bootstrap>["items"][number]) {
    const rawQuantity = quantities[item.item_id]?.trim() ?? "";
    if (!item.current_price) {
      Alert.alert("Price missing", `Today's price for ${item.item_name} is not available yet.`);
      return;
    }

    if (!rawQuantity || money(rawQuantity).lessThanOrEqualTo(0)) {
      Alert.alert("Invalid quantity", `Enter a valid quantity for ${item.item_name}.`);
      return;
    }

    if (item.base_unit === "unit" && !money(rawQuantity).isInteger()) {
      Alert.alert("Invalid quantity", `${item.item_name} accepts only whole unit values.`);
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
  const previewTotal = formatCurrency(getCartTotal(cartItems));

  if (loading && !activeBootstrap) {
    return <LoadingState fullscreen label="Loading today's prices..." />;
  }

  if (activeBootstrap && !activeBootstrap.prices_set) {
    return (
      <Screen>
        <Card className="gap-5 overflow-hidden bg-card p-0">
          <View className="gap-5 rounded-[30px] bg-accent px-5 py-5">
            <Text className="text-[11px] font-semibold uppercase tracking-[2.2px] text-white/75">Counter Workspace</Text>
            <Text className="text-[30px] font-bold leading-[38px] text-white">{activeBootstrap.shop_name}</Text>
            <Text className="text-sm leading-6 text-white/85">
              Billing stays locked until an admin publishes today's prices for this shop.
            </Text>
          </View>
        </Card>

        <EmptyState
          title="Waiting for admin price setup"
          description={`Today's prices for ${activeBootstrap.shop_name} have not been published yet. Ask an admin to update global daily prices from the admin dashboard.`}
        />
      </Screen>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <Screen>
        <SectionHeading
          eyebrow="Product Grid"
          title="Add products to the bill"
          subtitle="Each card shows the active daily rate, a fast quantity field, and a single-tap add action."
        />

        {activeBootstrap?.items.map((item) => {
          const itemImage = ITEM_IMAGES[item.item_name];

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
                      <Text className="text-lg font-semibold text-ink">{item.item_name}</Text>
                      <Text className="text-sm leading-6 text-muted">
                        {item.current_price ? formatCurrency(item.current_price) : "Price pending"} / {formatUnit(item.base_unit)}
                      </Text>
                      <Text className="text-[11px] uppercase tracking-[1.2px] text-muted">
                        {item.base_unit === "kg" ? "Sold by weight" : "Sold by unit"}
                      </Text>
                    </View>
                    <StatusPill
                      label={item.current_price ? `Ready - ${formatUnit(item.base_unit)}` : "Price missing"}
                      tone={item.current_price ? "success" : "warning"}
                    />
                  </View>
                  <TextField
                    label={item.base_unit === "kg" ? "Quantity in kg" : "Quantity in units"}
                    keyboardType="decimal-pad"
                    placeholder={item.base_unit === "kg" ? "Example 1.25" : "Example 2"}
                    value={quantities[item.item_id] ?? ""}
                    onChangeText={(value) => handleQuantityChange(item.item_id, value)}
                  />
                  <Button
                    label={item.current_price ? "Add To Cart" : "Awaiting Price"}
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
          eyebrow="Current Cart"
          title="Review before checkout"
          subtitle="Use this final pass to confirm quantities and remove anything before opening payment."
        />
        {cartItems.length === 0 ? (
          <EmptyState
            title="Cart is empty"
            description="Add one or more products above to start the current customer bill."
          />
        ) : (
          cartItems.map((item) => (
            <Card key={item.item_id} className="gap-4">
              <View className="flex-row flex-wrap items-start justify-between gap-3">
                <View className="flex-1 gap-1">
                  <Text className="text-base font-semibold text-ink">{item.item_name}</Text>
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
                <Text className="text-sm text-muted">Remove this line from the active bill</Text>
                <Button
                  label="Remove"
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
        label={cartItems.length === 0 ? "Add Items First" : "Proceed To Checkout"}
        disabled={cartItems.length === 0}
        onPress={() => navigation.navigate("Checkout")}
      />
    </View>
  );
}
