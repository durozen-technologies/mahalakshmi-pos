import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BillRead } from "@/types/api";

export type AppStackParamList = {
  AppLoading: undefined;
  BootstrapState: undefined;
  Login: undefined;
  AdminDashboard: undefined;
  Billing: undefined;
  Checkout: undefined;
  Receipt: { bill?: BillRead } | undefined;
  PrinterSetup: undefined;
};

export type LoginScreenProps = NativeStackScreenProps<AppStackParamList, "Login">;
export type AdminDashboardScreenProps = NativeStackScreenProps<AppStackParamList, "AdminDashboard">;
export type BillingScreenProps = NativeStackScreenProps<AppStackParamList, "Billing">;
export type CheckoutScreenProps = NativeStackScreenProps<AppStackParamList, "Checkout">;
export type ReceiptScreenProps = NativeStackScreenProps<AppStackParamList, "Receipt">;
export type PrinterSetupScreenProps = NativeStackScreenProps<AppStackParamList, "PrinterSetup">;
