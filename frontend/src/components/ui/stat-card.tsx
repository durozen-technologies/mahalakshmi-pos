import { Text } from "react-native";

import { Card } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string;
};

export function StatCard({ label, value }: StatCardProps) {
  return (
    <Card className="min-w-[132px] flex-1 basis-[148px] gap-2">
      <Text className="text-sm leading-5 text-muted">{label}</Text>
      <Text className="text-xl font-bold leading-7 text-ink">{value}</Text>
    </Card>
  );
}
