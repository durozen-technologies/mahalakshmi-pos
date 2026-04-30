import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { Controller, useForm } from "react-hook-form";

import { checkoutBill } from "@/api/billing";
import { toApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusPill } from "@/components/ui/status-pill";
import { TextField } from "@/components/ui/text-field";
import { CheckoutScreenProps } from "@/navigation/types";
import { getCartTotal, useCartStore } from "@/store/cart-store";
import { money, toMoneyString } from "@/utils/decimal";
import { formatCurrency, formatUnit } from "@/utils/format";

type CheckoutFormValues = {
  cashAmount: string;
  upiAmount: string;
};

export function CheckoutScreen({ navigation }: CheckoutScreenProps) {
  const cartItems = useCartStore((state) => state.items);
  const resetCart = useCartStore((state) => state.resetCart);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CheckoutFormValues>({
    defaultValues: {
      cashAmount: "0",
      upiAmount: "0",
    },
  });

  useEffect(() => {
    if (cartItems.length === 0) {
      navigation.replace("Billing");
    }
  }, [cartItems.length, navigation]);

  const totalAmount = money(getCartTotal(cartItems));
  const cashAmount = money(form.watch("cashAmount"));
  const upiAmount = money(form.watch("upiAmount"));
  const paidAmount = cashAmount.plus(upiAmount);
  const balanceAmount = totalAmount.minus(paidAmount);
  const isExact = paidAmount.equals(totalAmount) && totalAmount.greaterThan(0);
  const isOverpaid = paidAmount.greaterThan(totalAmount);

  async function handleCheckout(values: CheckoutFormValues) {
    if (!isExact) {
      return;
    }

    setSubmitting(true);
    try {
      const bill = await checkoutBill({
        items: cartItems.map((item) => ({
          item_id: item.item_id,
          quantity: item.base_unit === "unit" ? money(item.quantity).toFixed(0) : money(item.quantity).toString(),
        })),
        payment: {
          cash_amount: toMoneyString(values.cashAmount),
          upi_amount: toMoneyString(values.upiAmount),
        },
      });

      resetCart();
      navigation.replace("Receipt", { bill });
    } catch (error) {
      Alert.alert("Checkout failed", toApiError(error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <SectionHeading
        title="Checkout"
        subtitle="Receipt stays locked until cash and UPI exactly match the backend bill total."
      />

      <Card className="gap-3">
        <Text className="text-lg font-semibold text-ink">Order Summary</Text>
        {cartItems.map((item) => (
          <View key={item.item_id} className="flex-row flex-wrap items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-ink">{item.item_name}</Text>
              <Text className="text-xs leading-5 text-muted">
                {item.quantity} {formatUnit(item.base_unit)} x {formatCurrency(item.price_per_unit)}
              </Text>
            </View>
            <Text className="text-sm font-semibold text-ink">
              {formatCurrency(money(item.quantity).mul(money(item.price_per_unit)).toFixed(2))}
            </Text>
          </View>
        ))}
        <View className="mt-2 flex-row flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <Text className="text-base text-muted">Total amount</Text>
          <Text className="text-2xl font-bold text-ink">{formatCurrency(totalAmount.toFixed(2))}</Text>
        </View>
      </Card>

      <Card className="gap-4">
        <Controller
          control={form.control}
          name="cashAmount"
          render={({ field }) => (
            <TextField
              label="Cash amount"
              keyboardType="decimal-pad"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />
        <Controller
          control={form.control}
          name="upiAmount"
          render={({ field }) => (
            <TextField
              label="UPI amount"
              keyboardType="decimal-pad"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />

        <View className="rounded-[24px] bg-surface p-4">
          <View className="mb-2 flex-row flex-wrap items-center justify-between gap-2">
            <Text className="text-sm text-muted">Paid amount</Text>
            <Text className="text-base font-semibold text-ink">{formatCurrency(paidAmount.toFixed(2))}</Text>
          </View>
          <View className="mb-3 flex-row flex-wrap items-center justify-between gap-2">
            <Text className="text-sm text-muted">Balance amount</Text>
            <Text className="text-base font-semibold text-ink">{formatCurrency(balanceAmount.toFixed(2))}</Text>
          </View>

          {isExact ? (
            <StatusPill label="Payment matched" tone="success" />
          ) : isOverpaid ? (
            <StatusPill label="Overpaid - receipt locked" tone="danger" />
          ) : (
            <StatusPill label="Pending balance" tone="warning" />
          )}
        </View>

        <Button
          label="Print Receipt"
          onPress={form.handleSubmit(handleCheckout)}
          disabled={!isExact}
          loading={submitting}
        />
      </Card>
    </Screen>
  );
}
