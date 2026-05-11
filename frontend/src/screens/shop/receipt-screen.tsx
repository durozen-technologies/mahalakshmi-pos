import { useState } from "react";
import * as Print from "expo-print";
import { CommonActions } from "@react-navigation/native";
import { Alert, Text, View } from "react-native";

import { buildReceiptHtml, buildReceiptText } from "@/api/receipts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusPill } from "@/components/ui/status-pill";
import { ReceiptScreenProps } from "@/navigation/types";
import { useReceiptStore } from "@/store/receipt-store";
import { formatCurrency, formatDateTime, formatUnit } from "@/utils/format";

export function ReceiptScreen({ navigation, route }: ReceiptScreenProps) {
  const lastBill = useReceiptStore((state) => state.lastBill);
  const clearLastBill = useReceiptStore((state) => state.clearLastBill);
  const bill = route.params?.bill ?? lastBill;
  const [printing, setPrinting] = useState(false);

  if (!bill) {
    return (
      <Screen>
        <Card className="gap-4">
          <SectionHeading
            eyebrow="Receipt Missing"
            title="Receipt data is unavailable"
            subtitle="This can happen on web after a page reload. Start a new bill to generate the receipt again."
          />
          <Button label="Back To Billing" onPress={handleNextBill} />
        </Card>
      </Screen>
    );
  }

  function handleNextBill() {
    clearLastBill();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Billing" }],
      }),
    );
  }

  async function handlePrintReceipt() {
    try {
      setPrinting(true);
      await Print.printAsync({
        html: buildReceiptHtml(bill),
      });
    } catch (error) {
      Alert.alert(
        "Unable to open printer",
        "Make sure the mini printer is connected through Android printing or its iPrint app, then try again.",
      );
    } finally {
      setPrinting(false);
    }
  }

  const receiptPreview = buildReceiptText(bill);

  return (
    <Screen>
      <Card className="gap-5 overflow-hidden bg-card p-0">
        <View className="rounded-[30px] bg-accent px-5 py-5">
          <View className="flex-row flex-wrap items-start justify-between gap-3">
            <View className="flex-1 gap-2">
              <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-white/75">Receipt Complete</Text>
              <Text className="text-[30px] font-bold text-white">Receipt Ready</Text>
              <Text className="text-sm leading-6 text-white/85">
                The backend confirmed this transaction and marked the payment as settled.
              </Text>
            </View>
            <StatusPill label={bill.payment.is_settled ? "PAID" : bill.status} tone="success" />
          </View>
        </View>

        <View className="flex-row flex-wrap gap-3 px-5">
          <View className="min-w-[150px] flex-1 rounded-[24px] bg-surface px-4 py-4">
            <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted">Shop</Text>
            <Text className="mt-1 text-base font-semibold text-ink">{bill.shop_name}</Text>
            <Text className="mt-1 text-xs text-muted">{bill.bill_no}</Text>
          </View>
          <View className="min-w-[150px] flex-1 rounded-[24px] bg-surface px-4 py-4">
            <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted">Total collected</Text>
            <Text className="mt-1 text-2xl font-bold text-ink">{formatCurrency(bill.total_amount)}</Text>
            <Text className="mt-1 text-xs text-muted">{formatDateTime(bill.created_at)}</Text>
          </View>
        </View>

        <View className="flex-row flex-wrap items-start justify-between gap-3 px-5">
          <Text className="text-lg font-semibold text-ink">Purchased items</Text>
          <Text className="text-sm text-muted">{bill.items.length} line items</Text>
        </View>

        {bill.items.map((item) => (
          <View key={item.item_id} className="mx-5 flex-row flex-wrap items-start justify-between gap-3 rounded-[22px] bg-surface px-4 py-4">
            <View className="flex-1 gap-1">
              <Text className="text-sm font-semibold text-ink">{item.item_name}</Text>
              <Text className="text-xs leading-5 text-muted">
                {item.quantity} {formatUnit(item.unit)} x {formatCurrency(item.price_per_unit)}
              </Text>
            </View>
            <Text className="text-sm font-semibold text-ink">{formatCurrency(item.line_total)}</Text>
          </View>
        ))}

        <View className="gap-3 px-5 pb-5">
          <View className="gap-2 rounded-[24px] bg-surface p-4">
            <View className="flex-row flex-wrap justify-between gap-2">
              <Text className="text-sm text-muted">Total amount</Text>
              <Text className="text-sm font-semibold text-ink">{formatCurrency(bill.total_amount)}</Text>
            </View>
            <View className="flex-row flex-wrap justify-between gap-2">
              <Text className="text-sm text-muted">Cash amount</Text>
              <Text className="text-sm font-semibold text-ink">{formatCurrency(bill.payment.cash_amount)}</Text>
            </View>
            <View className="flex-row flex-wrap justify-between gap-2">
              <Text className="text-sm text-muted">UPI amount</Text>
              <Text className="text-sm font-semibold text-ink">{formatCurrency(bill.payment.upi_amount)}</Text>
            </View>
            <View className="flex-row flex-wrap justify-between gap-2">
              <Text className="text-sm text-muted">Receipt number</Text>
              <Text className="text-sm font-semibold text-ink">{bill.receipt.receipt_number}</Text>
            </View>
          </View>
        </View>
      </Card>

      <Card className="gap-4">
        <SectionHeading
          eyebrow="Printable Preview"
          title="Receipt text"
          subtitle="This is the compact plain-text version ready for printing or verification."
        />
        <View className="rounded-[24px] bg-surface p-4">
          <Text selectable className="text-sm leading-6 text-ink">
            {receiptPreview}
          </Text>
        </View>
      </Card>

      <View className="gap-3">
        <Button label="Print Receipt" onPress={() => void handlePrintReceipt()} loading={printing} />
        <Button label="Start Next Bill" onPress={handleNextBill} variant="secondary" />
      </View>
    </Screen>
  );
}
