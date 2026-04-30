import { Text, View } from "react-native";

type SectionHeadingProps = {
  title: string;
  subtitle?: string;
};

export function SectionHeading({ title, subtitle }: SectionHeadingProps) {
  return (
    <View className="gap-1">
      <Text className="text-xl font-bold leading-7 text-ink">{title}</Text>
      {subtitle ? <Text className="text-sm leading-6 text-muted">{subtitle}</Text> : null}
    </View>
  );
}
