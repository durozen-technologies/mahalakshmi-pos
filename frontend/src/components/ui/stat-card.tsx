import { Text, View } from "react-native";

import { Card } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string;
};

export function StatCard({ label, value }: StatCardProps) {
  return (
    <Card className="min-w-[132px] flex-1 basis-[148px] gap-3 bg-card">
      <View className="h-2 w-12 rounded-full bg-accent" />
      <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted">{label}</Text>
      <Text className="text-[26px] font-bold leading-8 text-ink">{value}</Text>
    </Card>
  );
}
