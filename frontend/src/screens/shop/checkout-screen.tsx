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
import { useReceiptStore } from "@/store/receipt-store";
import { money, toMoneyString } from "@/utils/decimal";
import { formatCurrency, formatUnit } from "@/utils/format";

type CheckoutFormValues = {
  cashAmount: string;
  upiAmount: string;
};

export function CheckoutScreen({ navigation }: CheckoutScreenProps) {
  const cartItems = useCartStore((state) => state.items);
  const resetCart = useCartStore((state) => state.resetCart);
  const setLastBill = useReceiptStore((state) => state.setLastBill);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutCompleted, setCheckoutCompleted] = useState(false);

  const form = useForm<CheckoutFormValues>({
    defaultValues: {
      cashAmount: "0",
      upiAmount: "0",
    },
  });

  useEffect(() => {
    if (cartItems.length === 0 && !checkoutCompleted) {
      navigation.replace("Billing");
    }
  }, [cartItems.length, checkoutCompleted, navigation]);

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

      setCheckoutCompleted(true);
      setLastBill(bill);
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
      <Card className="gap-5 overflow-hidden bg-card p-0">
        <View className="gap-4 rounded-[30px] bg-accent px-5 py-5">
          <View className="flex-row flex-wrap items-start justify-between gap-4">
            <View className="min-w-[220px] flex-1 gap-2">
              <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-white/75">Payment Review</Text>
              <Text className="text-[30px] font-bold leading-[38px] text-white">Checkout</Text>
              <Text className="text-sm leading-6 text-white/85">
                The receipt stays locked until the split payment exactly matches the backend bill total.
              </Text>
            </View>
            <View className="min-w-[170px] rounded-[24px] border border-white/15 bg-white/10 px-4 py-4">
              <Text className="text-[11px] font-semibold uppercase tracking-[1.8px] text-white/70">Total due</Text>
              <Text className="mt-2 text-[30px] font-bold text-white">{formatCurrency(totalAmount.toFixed(2))}</Text>
              <Text className="mt-1 text-xs text-white/75">{cartItems.length} line items in this bill</Text>
            </View>
          </View>
        </View>
        <View className="flex-row flex-wrap gap-3 px-5 pb-5">
          <View className="min-w-[140px] flex-1 rounded-[24px] bg-surface px-4 py-4">
            <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted">Paid so far</Text>
            <Text className="mt-1 text-2xl font-bold text-ink">{formatCurrency(paidAmount.toFixed(2))}</Text>
          </View>
          <View className="min-w-[140px] flex-1 rounded-[24px] bg-surface px-4 py-4">
            <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted">Balance</Text>
            <Text className="mt-1 text-2xl font-bold text-ink">{formatCurrency(balanceAmount.toFixed(2))}</Text>
          </View>
          <View className="min-w-[140px] flex-1 rounded-[24px] bg-surface px-4 py-4">
            <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted">Receipt state</Text>
            <Text className="mt-1 text-lg font-semibold text-ink">{isExact ? "Unlocked" : "Locked"}</Text>
          </View>
        </View>
      </Card>

      <Card className="gap-3">
        <SectionHeading
          eyebrow="Order Summary"
          title="Review the current bill"
          subtitle="Double-check quantities and totals before you confirm payment."
        />
        {cartItems.map((item) => (
          <View key={item.item_id} className="flex-row flex-wrap items-start justify-between gap-3 rounded-[22px] bg-surface px-4 py-4">
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
        <SectionHeading
          eyebrow="Split Payment"
          title="Enter payment amounts"
          subtitle="Keep cash and UPI aligned with the exact bill total to unlock receipt printing."
        />
        <Controller
          control={form.control}
          name="cashAmount"
          render={({ field }) => (
            <TextField
              label="Cash amount"
              keyboardType="decimal-pad"
              placeholder="0.00"
              suffix="Rs"
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
              placeholder="0.00"
              suffix="Rs"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />

        <View className="rounded-[26px] border border-border bg-surface p-4">
          <View className="mb-3 flex-row flex-wrap items-center justify-between gap-2">
            <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-muted">Receipt control</Text>
            {isExact ? (
              <StatusPill label="Payment matched" tone="success" />
            ) : isOverpaid ? (
              <StatusPill label="Overpaid - receipt locked" tone="danger" />
            ) : (
              <StatusPill label="Pending balance" tone="warning" />
            )}
          </View>
          <View className="gap-3 rounded-[22px] bg-card px-4 py-4">
            <View className="flex-row flex-wrap items-center justify-between gap-2">
              <Text className="text-sm text-muted">Paid amount</Text>
              <Text className="text-base font-semibold text-ink">{formatCurrency(paidAmount.toFixed(2))}</Text>
            </View>
            <View className="flex-row flex-wrap items-center justify-between gap-2">
              <Text className="text-sm text-muted">Balance amount</Text>
              <Text className="text-base font-semibold text-ink">{formatCurrency(balanceAmount.toFixed(2))}</Text>
            </View>
            <Text className="text-sm leading-6 text-muted">
              {isExact
                ? "Payment matches the bill total. Receipt printing is now unlocked."
                : isOverpaid
                  ? "The entered amount is higher than the bill total. Adjust the split to continue."
                  : "Add the remaining balance to match the exact bill total."}
            </Text>
          </View>
        </View>

        <Button
          label={isExact ? "Print Receipt" : "Receipt Locked"}
          onPress={form.handleSubmit(handleCheckout)}
          disabled={!isExact}
          loading={submitting}
        />
      </Card>
    </Screen>
  );
}
