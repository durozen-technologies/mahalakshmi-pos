import { useEffect } from "react";
import { Alert, Text, View } from "react-native";
import { Controller, useForm } from "react-hook-form";

import { fetchShopBootstrap, fetchTodayPrices, saveDailyPrices } from "@/api/prices";
import { toApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { Screen } from "@/components/ui/screen";
import { SectionHeading } from "@/components/ui/section-heading";
import { TextField } from "@/components/ui/text-field";
import { DailyPriceSetupScreenProps } from "@/navigation/types";
import { usePriceStore } from "@/store/price-store";
import { isPositiveNumber, toMoneyString } from "@/utils/decimal";
import { formatDate, formatUnit } from "@/utils/format";

type PriceFormValues = Record<string, string>;

export function DailyPriceSetupScreen({ navigation }: DailyPriceSetupScreenProps) {
  const bootstrap = usePriceStore((state) => state.bootstrap);
  const setBootstrap = usePriceStore((state) => state.setBootstrap);
  const setTodayPrices = usePriceStore((state) => state.setTodayPrices);

  const form = useForm<PriceFormValues>({
    defaultValues: {},
  });

  useEffect(() => {
    if (!bootstrap) {
      return;
    }

    const defaults = Object.fromEntries(
      bootstrap.items.map((item) => [`price_${item.item_id}`, item.current_price ?? ""]),
    );
    form.reset(defaults);
  }, [bootstrap, form]);

  async function handleSave(values: PriceFormValues) {
    if (!bootstrap) {
      return;
    }

    const entries = [];
    for (const item of bootstrap.items) {
      const raw = values[`price_${item.item_id}`]?.trim() ?? "";
      if (!isPositiveNumber(raw)) {
        Alert.alert("Invalid price", `Enter a valid price for ${item.item_name}.`);
        return;
      }
      entries.push({
        item_id: item.item_id,
        price_per_unit: toMoneyString(raw),
      });
    }

    try {
      await saveDailyPrices({ entries });
      const [nextBootstrap, nextPrices] = await Promise.all([fetchShopBootstrap(), fetchTodayPrices()]);
      setBootstrap(nextBootstrap);
      setTodayPrices(nextPrices);
      navigation.replace("Billing");
    } catch (error) {
      Alert.alert("Unable to save prices", toApiError(error).message);
    }
  }

  const isEditingExistingPrices = Boolean(bootstrap?.prices_set);
  const headingTitle = isEditingExistingPrices ? "Update Today's Prices" : "Set Today's Prices";
  const headingSubtitle = isEditingExistingPrices
    ? `Edit today's rates for ${formatDate(bootstrap?.price_date ?? new Date().toISOString())}. New bills will use the latest saved prices.`
    : `These prices are stored as a daily snapshot for ${formatDate(bootstrap.price_date)}.`;
  const submitLabel = isEditingExistingPrices ? "Save Updated Prices" : "Save Prices And Continue";

  if (!bootstrap) {
    return <LoadingState fullscreen label="Loading today's item list..." />;
  }

  return (
    <Screen>
      <View className="flex-row flex-wrap items-start justify-between gap-3">
        <View className="min-w-[220px] flex-1">
          <SectionHeading title={headingTitle} subtitle={headingSubtitle} />
        </View>
        {isEditingExistingPrices ? (
          <Button
            label="Back To Billing"
            onPress={() => navigation.replace("Billing")}
            variant="secondary"
            size="sm"
          />
        ) : null}
      </View>

      {bootstrap.items.map((item) => (
        <Card key={item.item_id} className="gap-3">
          <View className="gap-1">
            <Text className="text-lg font-semibold text-ink">{item.item_name}</Text>
            <Text className="text-sm leading-6 text-muted">Unit: {formatUnit(item.base_unit)}</Text>
          </View>
          <Controller
            control={form.control}
            name={`price_${item.item_id}`}
            render={({ field }) => (
              <TextField
                label="Price per unit"
                keyboardType="decimal-pad"
                value={field.value}
                onChangeText={field.onChange}
                suffix={formatUnit(item.base_unit)}
              />
            )}
          />
        </Card>
      ))}

      <Button label={submitLabel} onPress={form.handleSubmit(handleSave)} />
    </Screen>
  );
}
