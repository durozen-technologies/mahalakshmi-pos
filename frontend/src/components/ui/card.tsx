import { ReactNode } from "react";
import { View } from "react-native";

import { cn } from "@/utils/cn";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return <View className={cn("rounded-[28px] bg-white p-4 shadow-pos", className)}>{children}</View>;
}
