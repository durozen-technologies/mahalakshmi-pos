import { ReactNode } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type ScreenProps = {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  topSlot?: ReactNode;
  scroll?: boolean;
  topInset?: boolean;
  contentTopPadding?: number;
};

export function Screen({
  children,
  refreshing = false,
  onRefresh,
  topSlot,
  scroll = true,
  topInset = true,
  contentTopPadding = 16,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={topInset ? ["top", "left", "right"] : ["left", "right"]} className="flex-1 bg-cream">
      {topSlot ? <View className="px-4 pb-2">{topSlot}</View> : null}
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: contentTopPadding,
            paddingBottom: 112 + insets.bottom,
            gap: 20,
          }}
          refreshControl={
            onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#244734" /> : undefined
          }
        >
          <View className="w-full max-w-[820px] self-center gap-5">{children}</View>
        </ScrollView>
      ) : (
        <View className="flex-1 px-4" style={{ paddingTop: contentTopPadding }}>
          <View className="w-full max-w-[820px] flex-1 self-center">{children}</View>
        </View>
      )}
    </SafeAreaView>
  );
}
