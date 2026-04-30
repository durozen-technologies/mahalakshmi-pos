import { Text, TextInput, TextInputProps, View } from "react-native";

import { cn } from "@/utils/cn";

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  suffix?: string;
};

export function TextField({ label, error, suffix, className, ...props }: TextFieldProps) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-ink">{label}</Text>
      <View className="flex-row items-center rounded-3xl border border-border bg-surface px-4">
        <TextInput
          editable
          autoCorrect={false}
          underlineColorAndroid="transparent"
          selectionColor="#D97706"
          cursorColor="#D97706"
          placeholderTextColor="#9CA3AF"
          className={cn("min-h-14 flex-1 text-base text-ink", className)}
          {...props}
        />
        {suffix ? <Text className="text-sm font-semibold text-muted">{suffix}</Text> : null}
      </View>
      {error ? <Text className="text-sm text-red-700">{error}</Text> : null}
    </View>
  );
}
