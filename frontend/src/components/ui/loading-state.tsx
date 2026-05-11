import { ActivityIndicator, Text, View } from "react-native";

type LoadingStateProps = {
  label?: string;
  fullscreen?: boolean;
};

export function LoadingState({ label = "Loading...", fullscreen = false }: LoadingStateProps) {
  return (
    <View className={fullscreen ? "flex-1 items-center justify-center bg-cream px-6" : "items-center justify-center py-10"}>
      <View className="rounded-full border border-border bg-card p-5 shadow-pos">
        <ActivityIndicator size="large" color="#244734" />
      </View>
      <Text className="mt-4 text-sm text-muted">{label}</Text>
    </View>
  );
}
