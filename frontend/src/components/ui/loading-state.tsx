import { ActivityIndicator, Text, View } from "react-native";

type LoadingStateProps = {
  label?: string;
  fullscreen?: boolean;
};

export function LoadingState({ label = "Loading...", fullscreen = false }: LoadingStateProps) {
  return (
    <View className={fullscreen ? "flex-1 items-center justify-center bg-cream px-6" : "items-center justify-center py-10"}>
      <ActivityIndicator size="large" color="#D97706" />
      <Text className="mt-3 text-sm text-muted">{label}</Text>
    </View>
  );
}
