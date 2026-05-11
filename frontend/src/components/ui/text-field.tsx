import { Text, TextInput, TextInputProps, View } from "react-native";

import { cn } from "@/utils/cn";

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  suffix?: string;
};

export function TextField({ label, error, suffix, className, ...props }: TextFieldProps) {
  return (
    <View className="gap-2.5">
      <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-muted">{label}</Text>
      <View
        className={cn(
          "flex-row items-center rounded-[24px] border px-4 border-border bg-surface",
          error ? "border-[#9F4335] bg-card" : "",
        )}
      >
        <TextInput
          editable
          autoCorrect={false}
          underlineColorAndroid="transparent"
          selectionColor="#244734"
          cursorColor="#244734"
          placeholderTextColor="#95A293"
          className={cn("min-h-[58px] flex-1 text-base text-ink", className)}
          {...props}
        />
        {suffix ? <Text className="text-xs font-semibold uppercase tracking-[1px] text-muted">{suffix}</Text> : null}
      </View>
      {error ? <Text className="text-sm text-[#9F4335]">{error}</Text> : null}
    </View>
  );
}
