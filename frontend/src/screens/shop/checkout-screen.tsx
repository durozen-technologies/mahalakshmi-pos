import { useEffect, useState } from "react";
import { Alert, Linking, Text, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { CommonActions } from "@react-navigation/native";

import { checkoutBill } from "@/api/billing";
import { toApiError } from "@/api/client";
import { buildReceiptHtml } from "@/api/receipts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusPill } from "@/components/ui/status-pill";
import { TextField } from "@/components/ui/text-field";
import { useShopTranslation } from "@/hooks/use-shop-translation";
import { CheckoutScreenProps } from "@/navigation/types";
import { getCartTotal, useCartStore } from "@/store/cart-store";
import { money, toMoneyString } from "@/utils/decimal";
import { formatCurrency } from "@/utils/format";

type CheckoutFormValues = {
  cashAmount: string;
  upiAmount: string;
};

export function CheckoutScreen({ navigation }: CheckoutScreenProps) {
  const { t } = useShopTranslation();
  const cartItems = useCartStore((state) => state.items);
  const resetCart = useCartStore((state) => state.resetCart);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CheckoutFormValues>({
    defaultValues: {
      cashAmount: "",
      upiAmount: "",
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

      try {
        const receiptHtml = buildReceiptHtml(bill);
        await Linking.openURL(`printerapp://print?html=${encodeURIComponent(receiptHtml)}`);
      } catch {
        Alert.alert(t("checkout.unableToOpenPrinterTitle"), t("checkout.unableToOpenPrinterMessage"));
      }

      resetCart();
      form.reset({
        cashAmount: "0",
        upiAmount: "0",
      });
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Billing" }],
        }),
      );
    } catch (error) {
      Alert.alert(t("checkout.checkoutFailedTitle"), toApiError(error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Card className="gap-4">
        <SectionHeading
          eyebrow={t("checkout.splitPayment")}
          title={t("checkout.enterPaymentAmounts")}
          subtitle={t("checkout.enterPaymentAmountsSubtitle")}
        />
        <Controller
          control={form.control}
          name="cashAmount"
          render={({ field }) => (
            <TextField
              label={t("checkout.cashAmount")}
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
              label={t("checkout.upiAmount")}
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
            <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-muted">{t("checkout.receiptControl")}</Text>
            {isExact ? (
              <StatusPill label={t("checkout.paymentMatched")} tone="success" />
            ) : isOverpaid ? (
              <StatusPill label={t("checkout.overpaidLocked")} tone="danger" />
            ) : (
              <StatusPill label={t("checkout.pendingBalance")} tone="warning" />
            )}
          </View>
          <View className="gap-3 rounded-[22px] bg-card px-4 py-4">
            <View className="flex-row flex-wrap items-center justify-between gap-2">
              <Text className="text-sm text-muted">{t("common.paidAmount")}</Text>
              <Text className="text-base font-semibold text-ink">{formatCurrency(paidAmount.toFixed(2))}</Text>
            </View>
            <View className="flex-row flex-wrap items-center justify-between gap-2">
              <Text className="text-sm text-muted">{t("common.balanceAmount")}</Text>
              <Text className="text-base font-semibold text-ink">{formatCurrency(balanceAmount.toFixed(2))}</Text>
            </View>
            <Text className="text-sm leading-6 text-muted">
              {isExact
                ? t("checkout.paymentMatchedDescription")
                : isOverpaid
                  ? t("checkout.overpaidDescription")
                  : t("checkout.pendingBalanceDescription")}
            </Text>
          </View>
        </View>

        <Button
          label={isExact ? t("action.printReceipt") : t("action.receiptLocked")}
          onPress={form.handleSubmit(handleCheckout)}
          disabled={!isExact}
          loading={submitting}
        />
      </Card>
    </Screen>
  );
}
