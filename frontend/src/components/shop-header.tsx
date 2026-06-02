import { memo } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Button } from "@/components/ui/button";
import { ShopTranslationKey, useShopTranslation } from "@/hooks/use-shop-translation";

type ShopHeaderActionsProps = {
  onLogout: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
};

export const ShopHeaderActions = memo(function ShopHeaderActions({
  onLogout,
  onRefresh,
  refreshing = false,
}: ShopHeaderActionsProps) {
  const { language, t, toggleLanguage } = useShopTranslation();
  const translateLabel = language === "en" ? "TAMIL" : "EN";
  const refreshLabel = refreshing ? t("billing.refreshingPrices") : t("action.refreshBilling");

  return (
    <View className="flex-row items-center gap-1">
      {onRefresh ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={refreshLabel}
          accessibilityState={{ busy: refreshing, disabled: refreshing }}
          disabled={refreshing}
          onPress={onRefresh}
          className={`min-h-10 w-10 items-center justify-center rounded-[12px] border border-border bg-card shadow-soft ${
            refreshing ? "opacity-90" : ""
          }`}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#244734" />
          ) : (
            <MaterialCommunityIcons name="sync" size={18} color="#244734" />
          )}
        </Pressable>
      ) : null}
      <Button
        label={translateLabel}
        onPress={toggleLanguage}
        variant="secondary"
        size="sm"
        className="min-h-10 min-w-[76px] px-2"
        textClassName="text-[11px] leading-6"
      />
      <Button
        label={t("action.logout")}
        onPress={onLogout}
        variant="secondary"
        size="sm"
        className="min-h-10 px-2.5"
        textClassName="text-[11px] leading-6"
      />
    </View>
  );
});

type ShopHeaderTitleProps = {
  titleKey: ShopTranslationKey;
};

export const ShopHeaderTitle = memo(function ShopHeaderTitle({ titleKey }: ShopHeaderTitleProps) {
  const { t } = useShopTranslation();

  return <Text className="text-base font-bold text-ink">{t(titleKey)}</Text>;
});
