import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityRole,
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { adminShadow, type ThemePalette } from "../admin-dashboard-theme";
import { triggerHaptic, type ToastTone } from "../admin-dashboard-utils";

type MetricCardProps = {
  label: string;
  value: number;
  formatter: (value: number) => string;
  note: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  accent: string;
  accentSoft: string;
  palette: ThemePalette;
  sparklineValues?: number[];
};

type SectionCardProps = {
  title: string;
  subtitle: string;
  collapsed?: boolean;
  onToggle?: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
  palette: ThemePalette;
};

type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  palette: ThemePalette;
  accessibilityLabel?: string;
};

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  palette: ThemePalette;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  accessibilityLabel?: string;
};

type EmptyStateCardProps = {
  title: string;
  subtitle: string;
  palette: ThemePalette;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  actionLabel?: string;
  onAction?: () => void;
};

type ToastBannerProps = {
  toast: { tone: ToastTone; message: string } | null;
  palette: ThemePalette;
  animatedValue: Animated.Value;
};

type BottomNavProps = {
  items: { key: string; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }[];
  activeKey: string;
  onSelect: (key: string) => void;
  palette: ThemePalette;
  bottomOffset: number;
};

function CountUpText({
  value,
  formatter,
  style,
}: {
  value: number;
  formatter: (value: number) => string;
  style: object;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);

  useEffect(() => {
    const startValue = previousValueRef.current;
    const delta = value - startValue;
    const duration = 420;
    const start = Date.now();
    let frameId = 0;

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + delta * eased;
      setDisplayValue(nextValue);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        previousValueRef.current = value;
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return <Text style={style}>{formatter(displayValue)}</Text>;
}

function Sparkline({
  values,
  accent,
}: {
  values: number[];
  accent: string;
}) {
  const normalizedHeights = useMemo(() => {
    const max = Math.max(...values, 1);
    return values.map((value) => Math.max(10, (value / max) * 34));
  }, [values]);

  return (
    <View style={styles.sparklineRow}>
      {normalizedHeights.map((height, index) => (
        <View
          key={`${height}-${index}`}
          style={[styles.sparklineBar, { height, backgroundColor: accent }]}
        />
      ))}
    </View>
  );
}

export const MetricCard = memo(function MetricCard({
  label,
  value,
  formatter,
  note,
  icon,
  accent,
  accentSoft,
  palette,
  sparklineValues = [4, 6, 5, 8, 7, 9],
}: MetricCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} ${formatter(value)}`}
      onPress={() => triggerHaptic()}
      style={({ pressed }) => [
        styles.metricCard,
        adminShadow(palette.shadow, 0.06, 8, 16),
        {
          backgroundColor: palette.card,
          borderColor: palette.border,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View style={styles.metricHeader}>
        <View style={[styles.metricIconWrap, { backgroundColor: accentSoft }]}>
          <MaterialCommunityIcons name={icon} size={18} color={accent} />
        </View>
        <Sparkline values={sparklineValues} accent={accent} />
      </View>
      <Text style={[styles.metricLabel, { color: palette.textMuted }]}>{label}</Text>
      <CountUpText value={value} formatter={formatter} style={[styles.metricValue, { color: palette.textPrimary }]} />
      <Text style={[styles.metricNote, { color: palette.textSecondary }]}>{note}</Text>
    </Pressable>
  );
});

export const SectionCard = memo(function SectionCard({
  title,
  subtitle,
  collapsed = false,
  onToggle,
  action,
  children,
  palette,
}: SectionCardProps) {
  return (
    <View
      style={[
        styles.sectionCard,
        adminShadow(palette.shadow, 0.05, 8, 16),
        { backgroundColor: palette.card, borderColor: palette.border },
      ]}
    >
      <Pressable
        disabled={!onToggle}
        accessibilityRole={onToggle ? "button" : undefined}
        onPress={onToggle}
        style={styles.sectionHeader}
      >
        <View style={styles.sectionHeaderText}>
          <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>{title}</Text>
          <Text style={[styles.sectionSubtitle, { color: palette.textMuted }]}>{subtitle}</Text>
        </View>
        <View style={styles.sectionHeaderActions}>
          {action}
          {onToggle ? (
            <View style={[styles.chevronWrap, { backgroundColor: palette.backgroundElevated }]}>
              <MaterialCommunityIcons
                name={collapsed ? "chevron-down" : "chevron-up"}
                size={18}
                color={palette.textSecondary}
              />
            </View>
          ) : null}
        </View>
      </Pressable>
      {!collapsed ? children : null}
    </View>
  );
});

export const SearchField = memo(function SearchField({
  value,
  onChangeText,
  placeholder,
  palette,
  accessibilityLabel,
}: SearchFieldProps) {
  return (
    <View style={[styles.searchField, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
      <MaterialCommunityIcons name="magnify" size={16} color={palette.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.textMuted}
        style={[styles.searchInput, { color: palette.textPrimary }]}
        accessibilityLabel={accessibilityLabel ?? placeholder}
        returnKeyType="search"
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => onChangeText("")}
          hitSlop={12}
        >
          <MaterialCommunityIcons name="close-circle" size={16} color={palette.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
});

export const ChipButton = memo(function ChipButton({
  label,
  onPress,
  active,
  palette,
  icon,
  accessibilityRole = "button",
}: {
  label: string;
  onPress: () => void;
  active: boolean;
  palette: ThemePalette;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  accessibilityRole?: AccessibilityRole;
}) {
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      onPress={() => {
        triggerHaptic();
        onPress();
      }}
      style={[
        styles.chipButton,
        {
          backgroundColor: active ? palette.emeraldSoft : palette.surfaceMuted,
          borderColor: active ? palette.emerald : palette.border,
        },
      ]}
    >
      {icon ? <MaterialCommunityIcons name={icon} size={14} color={active ? palette.emeraldDark : palette.textMuted} /> : null}
      <Text style={[styles.chipText, { color: active ? palette.emeraldDark : palette.textSecondary }]}>{label}</Text>
    </Pressable>
  );
});

export const PrimaryButton = memo(function PrimaryButton({
  label,
  onPress,
  loading = false,
  variant = "primary",
  fullWidth = false,
  palette,
  icon,
  accessibilityLabel,
}: PrimaryButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={() => {
        triggerHaptic(isPrimary ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      disabled={loading}
      style={({ pressed }) => [
        styles.buttonBase,
        adminShadow(palette.shadow, isPrimary ? 0.1 : 0.04, 8, 16),
        {
          width: fullWidth ? "100%" : undefined,
          backgroundColor: isPrimary ? palette.emerald : palette.surfaceMuted,
          borderColor: isPrimary ? palette.emerald : palette.border,
          opacity: loading ? 0.72 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? "#FFFFFF" : palette.textPrimary} />
      ) : (
        <View style={styles.buttonContent}>
          {icon ? <MaterialCommunityIcons name={icon} size={16} color={isPrimary ? "#FFFFFF" : palette.textPrimary} /> : null}
          <Text style={[styles.buttonLabel, { color: isPrimary ? "#FFFFFF" : palette.textPrimary }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
});

export const EmptyStateCard = memo(function EmptyStateCard({
  title,
  subtitle,
  palette,
  icon = "star-outline",
  actionLabel,
  onAction,
}: EmptyStateCardProps) {
  return (
    <View style={[styles.emptyCard, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
      <View style={[styles.emptyIconWrap, { backgroundColor: palette.card }]}>
        <MaterialCommunityIcons name={icon} size={24} color={palette.emerald} />
      </View>
      <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>{title}</Text>
      <Text style={[styles.emptySubtitle, { color: palette.textMuted }]}>{subtitle}</Text>
      {actionLabel && onAction ? (
        <PrimaryButton
          label={actionLabel}
          onPress={onAction}
          palette={palette}
          variant="secondary"
        />
      ) : null}
    </View>
  );
});

export function ToastBanner({ toast, palette, animatedValue }: ToastBannerProps) {
  if (!toast) {
    return null;
  }

  const toneColor = toast.tone === "success" ? palette.success : palette.danger;
  const toneBackground = toast.tone === "success" ? palette.successSoft : palette.dangerSoft;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toastContainer,
        adminShadow(palette.shadow, 0.08, 8, 14),
        {
          backgroundColor: toneBackground,
          borderColor: toneColor,
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [-18, 0],
              }),
            },
          ],
        },
      ]}
    >
      <MaterialCommunityIcons
        name={toast.tone === "success" ? "check-circle-outline" : "alert-circle-outline"}
        size={18}
        color={toneColor}
      />
      <Text style={[styles.toastText, { color: toneColor }]}>{toast.message}</Text>
    </Animated.View>
  );
}

function ShimmerBlock({
  height,
  borderRadius,
  palette,
}: {
  height: number;
  borderRadius: number;
  palette: ThemePalette;
}) {
  const shimmer = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    );

    animation.start();
    return () => animation.stop();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [-1, 1],
    outputRange: [-220, 220],
  });

  return (
    <View
      style={[
        styles.skeletonBlock,
        {
          height,
          borderRadius,
          borderColor: palette.border,
          backgroundColor: palette.card,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.skeletonShimmer,
          {
            backgroundColor: palette.glass,
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

export function DashboardSkeleton({ palette }: { palette: ThemePalette }) {
  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <View style={styles.skeletonWrap}>
        <ShimmerBlock height={210} borderRadius={28} palette={palette} />
        <View style={styles.skeletonMetricGrid}>
          {Array.from({ length: 4 }).map((_, index) => (
            <ShimmerBlock key={index} height={122} borderRadius={24} palette={palette} />
          ))}
        </View>
        <ShimmerBlock height={180} borderRadius={26} palette={palette} />
        <ShimmerBlock height={180} borderRadius={26} palette={palette} />
      </View>
    </View>
  );
}

export const BottomNav = memo(function BottomNav({
  items,
  activeKey,
  onSelect,
  palette,
  bottomOffset,
}: BottomNavProps) {
  return (
    <View
      style={[
        styles.bottomNavWrap,
        adminShadow(palette.shadow, 0.12, 14, 20),
        {
          backgroundColor: palette.navBackdrop,
          borderColor: palette.border,
          bottom: bottomOffset,
        },
      ]}
    >
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.label}
            onPress={() => onSelect(item.key)}
            style={styles.bottomNavItem}
          >
            {active ? <View style={[styles.activeNavIndicator, { backgroundColor: palette.emeraldSoft }]} /> : null}
            <MaterialCommunityIcons name={item.icon} size={20} color={active ? palette.emerald : palette.textMuted} />
            <Text style={[styles.bottomNavLabel, { color: active ? palette.emerald : palette.textMuted }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  metricCard: {
    width: "48.2%",
    minWidth: 148,
    borderRadius: 24,
    borderWidth: 1,
    padding: 15,
    gap: 8,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metricIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  sparklineRow: {
    height: 34,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  sparklineBar: {
    width: 4,
    borderRadius: 999,
    opacity: 0.72,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "800",
  },
  metricNote: {
    fontSize: 12,
    lineHeight: 17,
  },
  sectionCard: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 26,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionHeaderText: {
    flex: 1,
    gap: 4,
  },
  sectionHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  chevronWrap: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  searchField: {
    minHeight: 46,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  chipButton: {
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  buttonBase: {
    minHeight: 50,
    borderRadius: 17,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    flex: 1,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: "800",
  },
  emptyCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 10,
    alignItems: "flex-start",
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  toastContainer: {
    position: "absolute",
    top: 10,
    left: 16,
    right: 16,
    zIndex: 50,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toastText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  skeletonWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  skeletonMetricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  skeletonBlock: {
    overflow: "hidden",
    borderWidth: 1,
  },
  skeletonShimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 120,
    opacity: 0.7,
  },
  bottomNavWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomNavItem: {
    minWidth: 56,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 48,
  },
  activeNavIndicator: {
    position: "absolute",
    top: 0,
    width: 46,
    height: 38,
    borderRadius: 16,
  },
  bottomNavLabel: {
    fontSize: 10,
    fontWeight: "700",
  },
});
