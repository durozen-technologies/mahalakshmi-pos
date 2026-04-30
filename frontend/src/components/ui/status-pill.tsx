import { Text, View } from "react-native";

import { cn } from "@/utils/cn";

type StatusPillProps = {
  label: string;
  tone?: "success" | "warning" | "danger" | "neutral";
};

export function StatusPill({ label, tone = "neutral" }: StatusPillProps) {
  const toneStyles = {
    success: {
      container: "bg-successSoft",
      text: "text-green-800",
    },
    warning: {
      container: "bg-warningSoft",
      text: "text-amber-800",
    },
    danger: {
      container: "bg-dangerSoft",
      text: "text-red-800",
    },
    neutral: {
      container: "bg-accentSoft",
      text: "text-amber-900",
    },
  }[tone];

  return (
    <View className={cn("self-start rounded-full px-3 py-1", toneStyles.container)}>
      <Text className={cn("text-xs font-semibold uppercase tracking-[1px]", toneStyles.text)}>{label}</Text>
    </View>
  );
}
