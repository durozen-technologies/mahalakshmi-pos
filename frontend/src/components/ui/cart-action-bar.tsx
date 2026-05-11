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
    <View className="absolute bottom-0 left-0 right-0 px-4" style={{ paddingBottom: Math.max(insets.bottom, 12) + 12 }}>
      <View className="w-full max-w-[768px] self-center">
        <View className="rounded-[32px] border border-border bg-card px-4 pb-4 pt-4 shadow-pos">
          <View className="mb-3 flex-row flex-wrap items-center justify-between gap-2">
            <View>
              <Text className="text-[11px] font-semibold uppercase tracking-[1.8px] text-muted">Live total</Text>
              <Text className="mt-1 text-xs text-muted">{disabled ? "Add products to unlock checkout" : "Ready for payment review"}</Text>
            </View>
            <Text className="text-[30px] font-bold text-ink">{total}</Text>
          </View>
          <Button label={label} onPress={onPress} disabled={disabled} />
        </View>
      </View>
    </View>
  );
}
