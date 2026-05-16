import { ReactNode } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type ScreenProps = {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  topSlot?: ReactNode;
  scroll?: boolean;
};

export function Screen({ children, refreshing = false, onRefresh, topSlot, scroll = true }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-cream">
      <View className="absolute inset-0">
        <View
          className="absolute -top-16 -right-10 h-72 w-72 rounded-full bg-accentSoft"
          style={{ opacity: 0.55 }}
        />
        <View
          className="absolute top-24 left-[-58px] h-44 w-44 rounded-full bg-white"
          style={{ opacity: 0.65 }}
        />
        <View
          className="absolute bottom-16 right-[-56px] h-52 w-52 rounded-full bg-surface"
          style={{ opacity: 0.9 }}
        />
      </View>
      {topSlot ? <View className="px-4 pb-2">{topSlot}</View> : null}
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
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
        <View className="flex-1 px-4 pt-4">
          <View className="w-full max-w-[820px] flex-1 self-center">{children}</View>
        </View>
      )}
    </SafeAreaView>
  );
}
