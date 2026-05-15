import { Text, View } from "react-native";

import { useShopTranslation } from "@/hooks/use-shop-translation";
import { cn } from "@/utils/cn";

type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
};

export function SectionHeading({ title, subtitle, eyebrow }: SectionHeadingProps) {
  const { isTamil } = useShopTranslation();

  return (
    <View className="gap-2">
      {eyebrow ? (
        <Text
          className={cn(
            "font-semibold text-accentDeep",
            isTamil ? "text-xs leading-5 tracking-[0px]" : "text-[11px] uppercase tracking-[2.4px]",
          )}
        >
          {eyebrow}
        </Text>
      ) : null}
      <Text className={cn("font-bold text-ink", isTamil ? "text-[23px] leading-9" : "text-[24px] leading-8")}>{title}</Text>
      {subtitle ? (
        <Text className={cn("max-w-[640px] text-[14px] text-muted", isTamil ? "leading-7" : "leading-6")}>{subtitle}</Text>
      ) : null}
    </View>
  );
}
