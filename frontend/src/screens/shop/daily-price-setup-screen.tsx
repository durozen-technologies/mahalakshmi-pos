import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { Screen } from "@/components/ui/screen";
import { SectionHeading } from "@/components/ui/section-heading";
import { DailyPriceSetupScreenProps } from "@/navigation/types";
import { usePriceStore } from "@/store/price-store";
import { formatDate, formatCurrency, formatUnit } from "@/utils/format";

export function DailyPriceSetupScreen({ navigation }: DailyPriceSetupScreenProps) {
  const bootstrap = usePriceStore((state) => state.bootstrap);
  const headingTitle = "Today's Prices";
  const headingSubtitle = bootstrap
    ? `Prices for ${bootstrap.shop_name} as of ${formatDate(bootstrap.price_date)}. Admin updates are read-only here.`
    : "Loading today's item list...";

  if (!bootstrap) {
    return <LoadingState fullscreen label="Loading today's item list..." />;
  }

  return (
    <Screen>
      <View className="flex-row flex-wrap items-start justify-between gap-3">
        <View className="min-w-[220px] flex-1">
          <SectionHeading title={headingTitle} subtitle={headingSubtitle} />
        </View>
        <Button label="Back To Billing" onPress={() => navigation.replace("Billing")} variant="secondary" size="sm" />
      </View>

      {bootstrap.items.map((item) => (
        <Card key={item.item_id} className="gap-3">
          <View className="gap-1">
            <Text className="text-lg font-semibold text-ink">{item.item_name}</Text>
            <Text className="text-sm leading-6 text-muted">Unit: {formatUnit(item.base_unit)}</Text>
            <Text className="text-base font-semibold text-ink">
              {item.current_price ? formatCurrency(item.current_price) : "Price pending"} / {formatUnit(item.base_unit)}
            </Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
