import { memo, ReactNode } from "react";
import { View } from "react-native";

import { cn } from "@/utils/cn";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export const Card = memo(function Card({ children, className }: CardProps) {
  return (
    <View className={cn("rounded-[16px] border border-border/90 bg-card p-4 shadow-soft", className)}>
      {children}
    </View>
  );
});
