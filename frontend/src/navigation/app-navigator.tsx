import { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuthHydration } from "@/hooks/use-auth-hydration";
import { AppStackParamList } from "@/navigation/types";
import { AdminDashboardScreen } from "@/screens/admin/admin-dashboard-screen";
import { LoginScreen } from "@/screens/auth/login-screen";
import { BillingScreen } from "@/screens/shop/billing-screen";
import { CheckoutScreen } from "@/screens/shop/checkout-screen";
import { ReceiptScreen } from "@/screens/shop/receipt-screen";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { usePriceStore } from "@/store/price-store";
import { useReceiptStore } from "@/store/receipt-store";

const Stack = createNativeStackNavigator<AppStackParamList>();

const screenOptions = {
  headerShadowVisible: false,
  headerStyle: { backgroundColor: "#F7F1E8" },
  headerTitleStyle: { color: "#1E2B22", fontWeight: "700" as const },
  contentStyle: { backgroundColor: "#F7F1E8" },
};

function useSessionReset() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const resetCart = useCartStore((state) => state.resetCart);
  const clearPrices = usePriceStore((state) => state.clear);
  const clearLastBill = useReceiptStore((state) => state.clearLastBill);

  return () => {
    clearSession();
    resetCart();
    clearPrices();
    clearLastBill();
  };
}

export function AppNavigator() {
  const hydrated = useAuthHydration();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const logout = useSessionReset();

  useEffect(() => {
    if (!token || !user) {
      useCartStore.getState().resetCart();
      usePriceStore.getState().clear();
      useReceiptStore.getState().clearLastBill();
    }
  }, [token, user]);

  if (!hydrated) {
    return <LoadingState fullscreen label="Restoring secure session..." />;
  }

  if (!token || !user) {
    return (
      <Stack.Navigator initialRouteName="Login" screenOptions={screenOptions}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    );
  }

  if (user.role === "admin") {
    return (
      <Stack.Navigator initialRouteName="AdminDashboard" screenOptions={screenOptions}>
        <Stack.Screen
          name="AdminDashboard"
          component={AdminDashboardScreen}
          options={{
            title: "Admin Dashboard",
            headerRight: () => <Button label="Logout" onPress={logout} variant="secondary" size="sm" />,
          }}
        />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator initialRouteName="Billing" screenOptions={screenOptions}>
      <Stack.Screen
        name="Billing"
        component={BillingScreen}
        options={{
          title: "Billing",
          headerRight: () => <Button label="Logout" onPress={logout} variant="secondary" size="sm" />,
        }}
      />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: "Checkout" }} />
      <Stack.Screen name="Receipt" component={ReceiptScreen} options={{ title: "Receipt" }} />
    </Stack.Navigator>
  );
}
