import { CommonActions } from "@react-navigation/native";
import { Text, View } from "react-native";

import { buildReceiptText } from "@/api/receipts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusPill } from "@/components/ui/status-pill";
import { ReceiptScreenProps } from "@/navigation/types";
import { formatCurrency, formatDateTime, formatUnit } from "@/utils/format";

export function ReceiptScreen({ navigation, route }: ReceiptScreenProps) {
  const { bill } = route.params;

  function handleNextBill() {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Billing" }],
      }),
    );
  }

  const receiptPreview = buildReceiptText(bill);

  return (
    <Screen>
      <SectionHeading
        title="Receipt Ready"
        subtitle="The backend confirmed this transaction and marked it as settled."
      />

      <Card className="gap-4">
        <View className="flex-row flex-wrap items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className="text-2xl font-bold text-ink">{bill.shop_name}</Text>
            <Text className="text-sm text-muted">{bill.bill_no}</Text>
            <Text className="text-sm text-muted">{formatDateTime(bill.created_at)}</Text>
          </View>
          <StatusPill label={bill.payment.is_settled ? "PAID" : bill.status} tone="success" />
        </View>

        {bill.items.map((item) => (
          <View key={item.item_id} className="flex-row flex-wrap items-start justify-between gap-3 border-t border-border pt-3">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-ink">{item.item_name}</Text>
              <Text className="text-xs leading-5 text-muted">
                {item.quantity} {formatUnit(item.unit)} x {formatCurrency(item.price_per_unit)}
              </Text>
            </View>
            <Text className="text-sm font-semibold text-ink">{formatCurrency(item.line_total)}</Text>
          </View>
        ))}

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
      </Card>

      <Card className="gap-3">
        <Text className="text-base font-semibold text-ink">Plain Receipt Preview</Text>
        <View className="rounded-[24px] bg-surface p-4">
          <Text selectable className="text-sm leading-6 text-ink">
            {receiptPreview}
          </Text>
        </View>
      </Card>

      <Button label="Start Next Bill" onPress={handleNextBill} />
    </Screen>
  );
}
