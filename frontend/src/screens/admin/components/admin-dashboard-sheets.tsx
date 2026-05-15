import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Controller, type UseFormReturn } from "react-hook-form";
import { useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { ShopBootstrapResponse } from "@/types/api";
import { formatCurrency } from "@/utils/format";

import { adminShadow, type ThemePalette } from "../admin-dashboard-theme";
import { triggerHaptic } from "../admin-dashboard-utils";
import { EmptyStateCard, PrimaryButton } from "./admin-dashboard-primitives";

type CreateShopFormValues = {
  name: string;
  code?: string;
};

type PriceUpdateSheetProps = {
  visible: boolean;
  onClose: () => void;
  palette: ThemePalette;
  bottomInset: number;
  priceLoading: boolean;
  priceBootstrap: ShopBootstrapResponse | null;
  currentPriceItem:
    | (ShopBootstrapResponse["items"][number] & {
        current_price?: string | null;
      })
    | null;
  selectedPriceItemId: number | null;
  onSelectItem: (itemId: number, currentPrice?: string | null) => void;
  draftPrice: string;
  onChangeDraftPrice: (value: string) => void;
  priceError: string | null;
  itemPickerOpen: boolean;
  onToggleItemPicker: () => void;
  effectiveDate: string;
  dateOptions: { value: string; label: string }[];
  datePickerOpen: boolean;
  onToggleDatePicker: () => void;
  onSelectDate: (value: string) => void;
  savingPrice: boolean;
  onSave: () => void;
};

type CreateShopSheetProps = {
  visible: boolean;
  onClose: () => void;
  palette: ThemePalette;
  bottomInset: number;
  creating: boolean;
  form: UseFormReturn<CreateShopFormValues>;
  onSubmit: () => void;
};

function useSwipeToClose(onClose: () => void) {
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 8,
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            translateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 100 || gestureState.vy > 0.9) {
            Animated.timing(translateY, {
              toValue: 420,
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              translateY.setValue(0);
              onClose();
            });
            return;
          }

          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [onClose, translateY],
  );

  return { panResponder, translateY };
}

export function PriceUpdateSheet({
  visible,
  onClose,
  palette,
  bottomInset,
  priceLoading,
  priceBootstrap,
  currentPriceItem,
  selectedPriceItemId,
  onSelectItem,
  draftPrice,
  onChangeDraftPrice,
  priceError,
  itemPickerOpen,
  onToggleItemPicker,
  effectiveDate,
  dateOptions,
  datePickerOpen,
  onToggleDatePicker,
  onSelectDate,
  savingPrice,
  onSave,
}: PriceUpdateSheetProps) {
  const { panResponder, translateY } = useSwipeToClose(onClose);

  const summaryText =
    currentPriceItem && draftPrice
      ? `${currentPriceItem.item_name} will update from ${
          currentPriceItem.current_price ? formatCurrency(currentPriceItem.current_price) : "not set"
        } to Rs. ${draftPrice} on ${effectiveDate}.`
      : "Select an item and enter a valid price to preview the update summary.";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalBackdrop, { backgroundColor: palette.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.bottomSheet,
              adminShadow(palette.shadow, 0.16, 18, 24),
              {
                backgroundColor: palette.card,
                borderColor: palette.border,
                paddingBottom: bottomInset + 16,
                transform: [{ translateY }],
              },
            ]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.headerTextWrap}>
                <Text style={[styles.sheetTitle, { color: palette.textPrimary }]}>Update Price</Text>
                <Text style={[styles.sheetSubtitle, { color: palette.textMuted }]}>
                  One quick flow to update price, date, and save with confidence.
                </Text>
              </View>
              <View style={styles.headerActions}>
                {!priceLoading && priceBootstrap && currentPriceItem ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Save price update"
                    accessibilityState={{ disabled: savingPrice }}
                    disabled={savingPrice}
                    onPress={onSave}
                    style={[
                      styles.headerSaveButton,
                      {
                        backgroundColor: palette.emerald,
                        borderColor: palette.emerald,
                        opacity: savingPrice ? 0.72 : 1,
                      },
                    ]}
                  >
                    {savingPrice ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="content-save-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.headerSaveButtonText}>Save</Text>
                      </>
                    )}
                  </Pressable>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close update price sheet"
                  onPress={onClose}
                  style={[styles.iconButton, { backgroundColor: palette.backgroundElevated, borderColor: palette.border }]}
                >
                  <MaterialCommunityIcons name="close" size={18} color={palette.textPrimary} />
                </Pressable>
              </View>
            </View>

            {priceLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={palette.emerald} />
                <Text style={[styles.loadingText, { color: palette.textSecondary }]}>Loading price controls...</Text>
              </View>
            ) : priceBootstrap && currentPriceItem ? (
              <>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.sheetContent}
                >
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: palette.textMuted }]}>Item</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Choose item to update"
                      onPress={() => {
                        triggerHaptic();
                        onToggleItemPicker();
                      }}
                      style={[styles.sheetField, { backgroundColor: palette.backgroundElevated, borderColor: palette.border }]}
                    >
                      <Text style={[styles.sheetFieldValue, { color: palette.textPrimary }]}>{currentPriceItem.item_name}</Text>
                      <MaterialCommunityIcons
                        name={itemPickerOpen ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={palette.textMuted}
                      />
                    </Pressable>
                    {itemPickerOpen ? (
                      <View style={[styles.optionMenu, { backgroundColor: palette.backgroundElevated, borderColor: palette.border }]}>
                        {priceBootstrap.items.map((item) => (
                          <Pressable
                            key={item.item_id}
                            onPress={() => onSelectItem(item.item_id, item.current_price)}
                            style={[
                              styles.optionItem,
                              item.item_id === selectedPriceItemId && { backgroundColor: palette.emeraldSoft },
                            ]}
                          >
                            <Text style={[styles.optionTitle, { color: palette.textPrimary }]}>{item.item_name}</Text>
                            <Text style={[styles.optionSubtitle, { color: palette.textMuted }]}>
                              {item.current_price ? formatCurrency(item.current_price) : "No current price"}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}
                  </View>

                  <View style={[styles.previewCard, { backgroundColor: palette.emeraldSoft, borderColor: palette.border }]}>
                    <Text style={[styles.previewLabel, { color: palette.emeraldDark }]}>Current Price</Text>
                    <Text style={[styles.previewValue, { color: palette.emeraldDark }]}>
                      {currentPriceItem.current_price ? formatCurrency(currentPriceItem.current_price) : "Not set"}
                    </Text>
                    <Text style={[styles.previewMeta, { color: palette.textSecondary }]}>
                      Unit: {currentPriceItem.base_unit.toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: palette.textMuted }]}>New Price</Text>
                    <View
                      style={[
                        styles.sheetField,
                        { backgroundColor: palette.backgroundElevated, borderColor: priceError ? palette.danger : palette.border },
                      ]}
                    >
                      <Text style={[styles.currencyPrefix, { color: palette.textMuted }]}>Rs.</Text>
                      <TextInput
                        value={draftPrice}
                        onChangeText={onChangeDraftPrice}
                        keyboardType="decimal-pad"
                        placeholder="Enter updated price"
                        placeholderTextColor={palette.textMuted}
                        style={[styles.sheetInput, { color: palette.textPrimary }]}
                        accessibilityLabel="Enter updated price"
                      />
                    </View>
                    {priceError ? <Text style={[styles.inlineError, { color: palette.danger }]}>{priceError}</Text> : null}
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: palette.textMuted }]}>Effective Date</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Select effective date"
                      onPress={() => {
                        triggerHaptic();
                        onToggleDatePicker();
                      }}
                      style={[styles.sheetField, { backgroundColor: palette.backgroundElevated, borderColor: palette.border }]}
                    >
                      <Text style={[styles.sheetFieldValue, { color: palette.textPrimary }]}>{effectiveDate}</Text>
                      <MaterialCommunityIcons
                        name={datePickerOpen ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={palette.textMuted}
                      />
                    </Pressable>
                    {datePickerOpen ? (
                      <View style={[styles.optionMenu, { backgroundColor: palette.backgroundElevated, borderColor: palette.border }]}>
                        {dateOptions.map((option) => (
                          <Pressable
                            key={option.value}
                            onPress={() => onSelectDate(option.value)}
                            style={[
                              styles.optionItem,
                              option.value === effectiveDate && { backgroundColor: palette.emeraldSoft },
                            ]}
                          >
                            <Text style={[styles.optionTitle, { color: palette.textPrimary }]}>{option.label}</Text>
                            <Text style={[styles.optionSubtitle, { color: palette.textMuted }]}>{option.value}</Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}
                  </View>

                  <View style={[styles.summaryCard, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                    <Text style={[styles.summaryTitle, { color: palette.textPrimary }]}>Save Summary</Text>
                    <Text style={[styles.summaryText, { color: palette.textSecondary }]}>{summaryText}</Text>
                  </View>
                </ScrollView>

                <View style={styles.actionsRow}>
                  <PrimaryButton label="Cancel" onPress={onClose} variant="secondary" palette={palette} />
                  <PrimaryButton
                    label="Save Price Update"
                    onPress={onSave}
                    loading={savingPrice}
                    icon="content-save-outline"
                    palette={palette}
                  />
                </View>
              </>
            ) : (
              <EmptyStateCard
                title="Price controls not available"
                subtitle="Load item pricing to prepare the next price update."
                actionLabel="Close"
                onAction={onClose}
                palette={palette}
              />
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function CreateShopSheet({
  visible,
  onClose,
  palette,
  bottomInset,
  creating,
  form,
  onSubmit,
}: CreateShopSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalBackdrop, { backgroundColor: palette.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View
            style={[
              styles.bottomSheet,
              adminShadow(palette.shadow, 0.16, 18, 24),
              {
                backgroundColor: palette.card,
                borderColor: palette.border,
                paddingBottom: bottomInset + 16,
              },
            ]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.headerTextWrap}>
                <Text style={[styles.sheetTitle, { color: palette.textPrimary }]}>Create Shop</Text>
                <Text style={[styles.sheetSubtitle, { color: palette.textMuted }]}>
                  Add a new branch account with a clean two-field setup.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close create shop sheet"
                onPress={onClose}
                style={[styles.iconButton, { backgroundColor: palette.backgroundElevated, borderColor: palette.border }]}
              >
                <MaterialCommunityIcons name="close" size={18} color={palette.textPrimary} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.sheetContent}>
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <View style={styles.fieldGroup}>
                      <Text style={[styles.fieldLabel, { color: palette.textMuted }]}>Shop Name</Text>
                      <View
                        style={[
                          styles.sheetField,
                          {
                            backgroundColor: palette.backgroundElevated,
                            borderColor: fieldState.error ? palette.danger : palette.border,
                          },
                        ]}
                      >
                        <TextInput
                          value={field.value}
                          onChangeText={field.onChange}
                          placeholder="Enter branch name"
                          placeholderTextColor={palette.textMuted}
                          style={[styles.sheetInput, { color: palette.textPrimary }]}
                          accessibilityLabel="Enter shop name"
                        />
                      </View>
                      {fieldState.error ? <Text style={[styles.inlineError, { color: palette.danger }]}>{fieldState.error.message}</Text> : null}
                    </View>
                  )}
                />

                <Controller
                  control={form.control}
                  name="code"
                  render={({ field, fieldState }) => (
                    <View style={styles.fieldGroup}>
                      <Text style={[styles.fieldLabel, { color: palette.textMuted }]}>Shop Code</Text>
                      <View
                        style={[
                          styles.sheetField,
                          {
                            backgroundColor: palette.backgroundElevated,
                            borderColor: fieldState.error ? palette.danger : palette.border,
                          },
                        ]}
                      >
                        <TextInput
                          value={field.value}
                          onChangeText={field.onChange}
                          placeholder="Optional code"
                          autoCapitalize="characters"
                          placeholderTextColor={palette.textMuted}
                          style={[styles.sheetInput, { color: palette.textPrimary }]}
                          accessibilityLabel="Enter shop code"
                        />
                      </View>
                      {fieldState.error ? <Text style={[styles.inlineError, { color: palette.danger }]}>{fieldState.error.message}</Text> : null}
                    </View>
                  )}
                />
              </View>
            </ScrollView>

            <PrimaryButton
              label="Create Shop Account"
              onPress={onSubmit}
              loading={creating}
              icon="store-plus-outline"
              fullWidth
              palette={palette}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bottomSheet: {
    maxHeight: "88%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  sheetHandle: {
    width: 54,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerSaveButton: {
    minHeight: 40,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  headerSaveButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: {
    fontSize: 21,
    fontWeight: "800",
  },
  sheetSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 13,
  },
  sheetContent: {
    gap: 14,
    paddingBottom: 14,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  sheetField: {
    minHeight: 54,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  sheetFieldValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  optionMenu: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  optionItem: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 4,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  optionSubtitle: {
    fontSize: 12,
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 6,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  previewValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  previewMeta: {
    fontSize: 12,
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: "700",
  },
  sheetInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  inlineError: {
    fontSize: 12,
    lineHeight: 18,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 15,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 8,
  },
});
