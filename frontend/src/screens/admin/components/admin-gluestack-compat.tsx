import { memo } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  StyleSheet,
  useColorScheme,
  type TextInputProps,
} from "react-native";

import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "@/components/gluestack";
import { cn } from "@/utils/cn";

import { adminShadow, getAdminPalette } from "../admin-dashboard-theme";

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
  size?: "md" | "sm";
  className?: string;
  textClassName?: string;
};

export const Button = memo(function Button({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "md",
  className,
  textClassName,
}: ButtonProps) {
  const palette = getAdminPalette(useColorScheme());
  const isSecondary = variant === "secondary";
  const isDisabled = disabled || loading;
  const backgroundColor = isSecondary
    ? palette.surfaceMuted
    : variant === "danger"
      ? palette.danger
      : palette.primary;
  const borderColor = isSecondary ? palette.border : backgroundColor;
  const textColor = isSecondary ? palette.textPrimary : palette.onPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      className={cn("items-center justify-center", className)}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        size === "sm" ? styles.buttonSm : styles.buttonMd,
        {
          backgroundColor,
          borderColor,
        },
        !isSecondary && adminShadow(palette.shadow, 0.14, 14, 8),
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      <View style={styles.buttonInner}>
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <Text
            className={cn("text-center font-semibold", textClassName)}
            style={[
              styles.buttonText,
              size === "sm" ? styles.buttonTextSm : null,
              { color: textColor },
            ]}
          >
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
});

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  suffix?: string;
  className?: string;
};

export const TextField = memo(function TextField({
  label,
  error,
  suffix,
  className,
  style,
  ...props
}: TextFieldProps) {
  const palette = getAdminPalette(useColorScheme());

  return (
    <View style={styles.fieldStack}>
      <Text style={[styles.fieldLabel, { color: palette.textMuted }]}>{label}</Text>
      <View
        style={[
          styles.fieldShell,
          {
            backgroundColor: palette.surfaceMuted,
            borderColor: error ? palette.danger : palette.border,
          },
        ]}
      >
        <TextInput
          autoCorrect={false}
          className={cn("flex-1", className)}
          cursorColor={palette.primary}
          editable
          placeholderTextColor={palette.textMuted}
          selectionColor={palette.primary}
          style={[styles.fieldInput, { color: palette.textPrimary }, style]}
          underlineColorAndroid="transparent"
          {...props}
        />
        {suffix ? <Text style={[styles.fieldSuffix, { color: palette.textMuted }]}>{suffix}</Text> : null}
      </View>
      {error ? <Text style={[styles.fieldError, { color: palette.danger }]}>{error}</Text> : null}
    </View>
  );
});

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  const palette = getAdminPalette(useColorScheme());

  return (
    <View
      style={[
        styles.emptyCard,
        {
          backgroundColor: palette.card,
          borderColor: palette.border,
        },
        adminShadow(palette.shadow, 0.08, 16, 8),
      ]}
    >
      <View style={[styles.emptyIcon, { backgroundColor: palette.primarySoft }]}>
        <MaterialCommunityIcons name="view-dashboard-outline" size={24} color={palette.primaryStrong} />
      </View>
      <View style={styles.emptyCopy}>
        <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>{title}</Text>
        <Text style={[styles.emptyDescription, { color: palette.textMuted }]}>{description}</Text>
      </View>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" /> : null}
    </View>
  );
}

type LoadingStateProps = {
  label?: string;
  fullscreen?: boolean;
};

export function LoadingState({ label = "Loading...", fullscreen = false }: LoadingStateProps) {
  const palette = getAdminPalette(useColorScheme());

  return (
    <View
      style={[
        styles.loadingShell,
        fullscreen ? styles.loadingFullscreen : null,
        { backgroundColor: fullscreen ? palette.background : "transparent" },
      ]}
    >
      <View
        style={[
          styles.loadingBadge,
          { backgroundColor: palette.card, borderColor: palette.border },
          adminShadow(palette.shadow, 0.08, 14, 6),
        ]}
      >
        <ActivityIndicator color={palette.primary} size="large" />
      </View>
      <Text style={[styles.loadingLabel, { color: palette.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderWidth: 1,
    justifyContent: "center",
  },
  buttonMd: {
    borderRadius: 14,
    minHeight: 50,
    paddingHorizontal: 20,
  },
  buttonSm: {
    borderRadius: 12,
    minHeight: 40,
    paddingHorizontal: 16,
  },
  buttonInner: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  buttonText: {
    fontSize: 15,
    letterSpacing: 0,
    lineHeight: 20,
  },
  buttonTextSm: {
    fontSize: 14,
  },
  disabled: {
    opacity: 0.62,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  fieldStack: {
    gap: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 16,
  },
  fieldShell: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 52,
  },
  fieldSuffix: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0,
  },
  fieldError: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyCard: {
    alignItems: "center",
    borderRadius: 18,
    borderStyle: "dashed",
    borderWidth: 1,
    gap: 16,
    paddingHorizontal: 22,
    paddingVertical: 34,
  },
  emptyIcon: {
    borderRadius: 999,
    padding: 14,
  },
  emptyCopy: {
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 320,
    textAlign: "center",
  },
  loadingShell: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingFullscreen: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingBadge: {
    borderRadius: 999,
    borderWidth: 1,
    padding: 20,
  },
  loadingLabel: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 16,
  },
});
