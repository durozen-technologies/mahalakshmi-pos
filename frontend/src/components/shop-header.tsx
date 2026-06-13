import { memo, type ComponentProps, useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, TouchableWithoutFeedback, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Button } from "@/components/ui/button";
import { ShopTranslationKey, useShopTranslation } from "@/hooks/use-shop-translation";

type ShopHeaderActionsProps = {
  onLogout: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  onInventory?: () => void;
  onExpenses?: () => void;
  onPrinter?: () => void;
};

export const ShopHeaderActions = memo(function ShopHeaderActions({
  onLogout,
  onRefresh,
  refreshing = false,
  onInventory,
  onExpenses,
  onPrinter,
}: ShopHeaderActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { language, t, toggleLanguage } = useShopTranslation();
  const translateLabel = language === "en" ? "TAMIL" : "EN";
  const refreshLabel = refreshing ? t("billing.refreshingPrices") : t("action.refreshBilling");

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleMenuAction(action?: () => void) {
    closeMenu();
    action?.();
  }

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
            <ActivityIndicator size="small" color="#147D52" />
          ) : (
            <MaterialCommunityIcons name="sync" size={18} color="#147D52" />
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Menu"
        accessibilityState={{ expanded: menuOpen }}
        onPress={() => setMenuOpen(true)}
        className="min-h-10 min-w-[70px] flex-row items-center justify-center gap-1 rounded-[12px] border border-border bg-card px-2.5 shadow-soft"
      >
        <MaterialCommunityIcons name="menu" size={18} color="#147D52" />
        <Text className="text-[11px] font-semibold leading-6 tracking-[0.3px] text-ink">
          Menu
        </Text>
      </Pressable>

      <Modal transparent visible={menuOpen} animationType="fade" onRequestClose={closeMenu}>
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View className="flex-1 bg-black/20">
            <TouchableWithoutFeedback>
              <View className="absolute right-5 top-16 w-[280px] overflow-hidden rounded-[18px] border border-border bg-card shadow-soft">
                <MenuItem
                  icon="warehouse"
                  label={t("inventory.title")}
                  onPress={() => handleMenuAction(onInventory)}
                />
                <MenuItem
                  icon="cash-minus"
                  label={t("expenses.title")}
                  onPress={() => handleMenuAction(onExpenses)}
                />
                <MenuItem
                  icon="printer-outline"
                  label={t("header.printerSetup")}
                  onPress={() => handleMenuAction(onPrinter)}
                />
                <View className="border-t border-border p-3">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("action.logout")}
                    onPress={() => handleMenuAction(onLogout)}
                    className="min-h-[50px] w-full items-center justify-center rounded-[16px] border border-[#9F4335] bg-[#9F4335] px-5"
                  >
                    <Text className="text-center text-lg font-extrabold text-white">
                      {t("action.logout")}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
});

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="min-h-[80px] flex-row items-center gap-5 border-b border-border/70 px-6"
    >
      <MaterialCommunityIcons name={icon} size={30} color="#147D52" />
      <Text className="flex-1 text-base font-extrabold text-ink">{label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={28} color="#6C7A70" />
    </Pressable>
  );
}

type ShopHeaderTitleProps = {
  titleKey: ShopTranslationKey;
  shopName?: string | null;
};

export const ShopHeaderTitle = memo(function ShopHeaderTitle({ titleKey, shopName }: ShopHeaderTitleProps) {
  const { t } = useShopTranslation();
  const displayShopName = shopName?.trim();

  return (
    <View className="min-w-0">
      {displayShopName ? (
        <>
          <Text className="max-w-[220px] text-xl font-extrabold leading-7 text-ink" numberOfLines={1}>
            {displayShopName}
          </Text>
          <Text className="text-[11px] font-semibold leading-4 text-muted" numberOfLines={1}>
            {t(titleKey)}
          </Text>
        </>
      ) : (
        <Text className="text-lg font-extrabold leading-6 text-ink">{t(titleKey)}</Text>
      )}
    </View>
  );
});
