import { ActivityIndicator, Pressable, Text } from "react-native";

import { cn } from "@/utils/cn";

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

export function Button({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "md",
  className,
  textClassName,
}: ButtonProps) {
  const palette = {
    primary: "bg-accent",
    secondary: "bg-white border border-border",
    danger: "bg-red-700",
  }[variant];

  const textColor = variant === "secondary" ? "text-ink" : "text-white";
  const sizeStyles = size === "sm" ? "min-h-10 rounded-2xl px-4" : "min-h-14 rounded-3xl px-5";
  const textSize = size === "sm" ? "text-sm" : "text-base";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        "items-center justify-center",
        palette,
        sizeStyles,
        (disabled || loading) && "opacity-50",
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? "#1F2937" : "#FFFFFF"} />
      ) : (
        <Text className={cn("font-semibold", textColor, textSize, textClassName)}>{label}</Text>
      )}
    </Pressable>
  );
}
