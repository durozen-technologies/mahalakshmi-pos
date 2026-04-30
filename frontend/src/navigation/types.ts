import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { BillRead } from "@/types/api";

export type AuthStackParamList = {
  Login: undefined;
};

export type AdminStackParamList = {
  AdminDashboard: undefined;
};

export type ShopStackParamList = {
  DailyPriceSetup: undefined;
  Billing: undefined;
  Checkout: undefined;
  Receipt: { bill: BillRead };
};

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, "Login">;
export type AdminDashboardScreenProps = NativeStackScreenProps<
  AdminStackParamList,
  "AdminDashboard"
>;
export type DailyPriceSetupScreenProps = NativeStackScreenProps<
  ShopStackParamList,
  "DailyPriceSetup"
>;
export type BillingScreenProps = NativeStackScreenProps<ShopStackParamList, "Billing">;
export type CheckoutScreenProps = NativeStackScreenProps<ShopStackParamList, "Checkout">;
export type ReceiptScreenProps = NativeStackScreenProps<ShopStackParamList, "Receipt">;
