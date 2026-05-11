import { ReactNode } from "react";
import { View } from "react-native";

import { cn } from "@/utils/cn";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <View className={cn("rounded-[32px] border border-border/90 bg-card p-5 shadow-soft", className)}>
      {children}
    </View>
  );
}
