import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card className="items-center gap-4 border-dashed bg-card py-9">
      <View className="rounded-full bg-accentSoft p-4">
        <MaterialCommunityIcons name="leaf-circle-outline" size={24} color="#183224" />
      </View>
      <View className="items-center gap-2">
        <Text className="text-lg font-semibold text-ink">{title}</Text>
        <Text className="max-w-[320px] text-center text-sm leading-6 text-muted">{description}</Text>
      </View>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" /> : null}
    </Card>
  );
}
