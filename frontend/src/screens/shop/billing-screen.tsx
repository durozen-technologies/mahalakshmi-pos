import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CartActionBar } from "@/components/ui/cart-action-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";
import { SectionHeading } from "@/components/ui/section-heading";
import { TextField } from "@/components/ui/text-field";
import { BillingScreenProps } from "@/navigation/types";
import { CartItem, getCartTotal, useCartStore } from "@/store/cart-store";
import { usePriceStore } from "@/store/price-store";
import { money, toQuantityString } from "@/utils/decimal";
import { formatCurrency, formatUnit } from "@/utils/format";

export function BillingScreen({ navigation }: BillingScreenProps) {
  const bootstrap = usePriceStore((state) => state.bootstrap);
  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const resetCart = useCartStore((state) => state.resetCart);
  const [quantities, setQuantities] = useState<Record<number, string>>({});

  useEffect(() => {
    if (bootstrap && !bootstrap.prices_set) {
      navigation.replace("DailyPriceSetup");
    }
  }, [bootstrap, navigation]);

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

  function openPriceSetup() {
    navigation.replace("DailyPriceSetup");
  }

  function handleChangeTodayPrice() {
    if (cartItems.length === 0) {
      openPriceSetup();
      return;
    }

    Alert.alert(
      "Change today's prices?",
      "Updating today's prices will clear the current cart so all new bill items use the latest rates.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Cart And Continue",
          style: "destructive",
          onPress: () => {
            resetCart();
            openPriceSetup();
          },
        },
      ],
    );
  }

  const previewTotal = formatCurrency(getCartTotal(cartItems));

  return (
    <View className="flex-1 bg-cream">
      <Screen>
        <View className="flex-row flex-wrap items-start justify-between gap-3">
          <View className="min-w-[220px] flex-1">
            <SectionHeading
              title={bootstrap?.shop_name ?? "Billing"}
              subtitle="Add meat items, track the live total, and move to checkout when ready."
            />
          </View>
          <Button
            label="Change Today's Price"
            onPress={handleChangeTodayPrice}
            variant="secondary"
            size="sm"
          />
        </View>

        {bootstrap?.items.map((item) => (
          <Card key={item.item_id} className="gap-4">
            <View className="flex-row flex-wrap items-start justify-between gap-3">
              <View className="flex-1 gap-1">
                <Text className="text-lg font-semibold text-ink">{item.item_name}</Text>
                <Text className="text-sm leading-6 text-muted">
                  {item.current_price ? formatCurrency(item.current_price) : "Price pending"} / {formatUnit(item.base_unit)}
                </Text>
              </View>
              <Text className="rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold uppercase tracking-[1px] text-amber-900">
                {formatUnit(item.base_unit)}
              </Text>
            </View>
            <TextField
              label={item.base_unit === "kg" ? "Quantity in kg" : "Quantity in units"}
              keyboardType="decimal-pad"
              value={quantities[item.item_id] ?? ""}
              onChangeText={(value) => handleQuantityChange(item.item_id, value)}
            />
            <Button label="Add To Cart" onPress={() => handleAddToCart(item)} />
          </Card>
        ))}

        <SectionHeading
          title="Current Cart"
          subtitle="Preview-only totals for speed at the counter. Final bill truth comes from the backend."
        />
        {cartItems.length === 0 ? (
          <EmptyState
            title="Cart is empty"
            description="Add one or more items above to start the bill."
          />
        ) : (
          cartItems.map((item) => (
            <Card key={item.item_id} className="gap-3">
              <View className="flex-row flex-wrap items-start justify-between gap-3">
                <View className="flex-1 gap-1">
                  <Text className="text-base font-semibold text-ink">{item.item_name}</Text>
                  <Text className="text-sm leading-6 text-muted">
                    {item.quantity} {formatUnit(item.base_unit)} x {formatCurrency(item.price_per_unit)}
                  </Text>
                </View>
                <Text className="text-base font-bold text-ink">
                  {formatCurrency(money(item.quantity).mul(money(item.price_per_unit)).toFixed(2))}
                </Text>
              </View>
              <Button
                label="Remove"
                onPress={() => removeItem(item.item_id)}
                variant="secondary"
                size="sm"
                className="self-start"
              />
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
