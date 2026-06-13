import { memo } from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";

import { useShopTranslation } from "@/hooks/use-shop-translation";
import { cn } from "@/utils/cn";

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  suffix?: string;
};

export const TextField = memo(function TextField({ label, error, suffix, className, ...props }: TextFieldProps) {
  const { isTamil } = useShopTranslation();

  return (
    <View className="gap-2.5">
      <Text
        className={cn(
          "font-semibold text-muted",
          isTamil ? "text-xs leading-5 tracking-[0px]" : "text-[11px] uppercase tracking-[1.4px]",
        )}
      >
        {label}
      </Text>
      <View
        className={cn(
          "flex-row items-center rounded-[14px] border px-4 border-border bg-surface",
          error ? "border-[#9F4335] bg-card" : "",
        )}
      >
        <TextInput
          editable
          autoCorrect={false}
          underlineColorAndroid="transparent"
          selectionColor="#147D52"
          cursorColor="#147D52"
          placeholderTextColor="#95A293"
          className={cn("min-h-[52px] flex-1 text-base text-ink", isTamil && "leading-6", className)}
          {...props}
        />
        {suffix ? (
          <Text
            className={cn(
              "font-semibold text-muted",
              isTamil ? "text-xs leading-5 tracking-[0px]" : "text-xs uppercase tracking-[1px]",
            )}
          >
            {suffix}
          </Text>
        ) : null}
      </View>
      {error ? <Text className="text-sm text-[#9F4335]">{error}</Text> : null}
    </View>
  );
});
