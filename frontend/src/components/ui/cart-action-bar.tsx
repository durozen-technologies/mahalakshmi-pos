import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";

type CartActionBarProps = {
  total: string;
  disabled?: boolean;
  label: string;
  onPress: () => void;
};

export function CartActionBar({ total, disabled, label, onPress }: CartActionBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute bottom-0 left-0 right-0 border-t border-border bg-white px-4 pt-4"
      style={{ paddingBottom: Math.max(insets.bottom, 12) + 12 }}
    >
      <View className="w-full max-w-[768px] self-center">
        <View className="mb-3 flex-row flex-wrap items-center justify-between gap-2">
          <Text className="text-sm text-muted">Live total</Text>
          <Text className="text-2xl font-bold text-ink">{total}</Text>
        </View>
        <Button label={label} onPress={onPress} disabled={disabled} />
      </View>
    </View>
  );
}
