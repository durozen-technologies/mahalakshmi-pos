import { Text, View } from "react-native";

type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
};

export function SectionHeading({ title, subtitle, eyebrow }: SectionHeadingProps) {
  return (
    <View className="gap-2">
      {eyebrow ? (
        <Text className="text-[11px] font-semibold uppercase tracking-[2.4px] text-accentDeep">{eyebrow}</Text>
      ) : null}
      <Text className="text-[24px] font-bold leading-8 text-ink">{title}</Text>
      {subtitle ? <Text className="max-w-[640px] text-[14px] leading-6 text-muted">{subtitle}</Text> : null}
    </View>
  );
}
