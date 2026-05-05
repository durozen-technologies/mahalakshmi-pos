import { useEffect } from "react";
import { Text, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuthHydration } from "@/hooks/use-auth-hydration";
import { useShopBootstrap } from "@/hooks/use-shop-bootstrap";
import {
  AdminStackParamList,
  AuthStackParamList,
  ShopStackParamList,
} from "@/navigation/types";
import { AdminDashboardScreen } from "@/screens/admin/admin-dashboard-screen";
import { LoginScreen } from "@/screens/auth/login-screen";
import { BillingScreen } from "@/screens/shop/billing-screen";
import { CheckoutScreen } from "@/screens/shop/checkout-screen";
import { DailyPriceSetupScreen } from "@/screens/shop/daily-price-setup-screen";
import { ReceiptScreen } from "@/screens/shop/receipt-screen";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { usePriceStore } from "@/store/price-store";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AdminStack = createNativeStackNavigator<AdminStackParamList>();
const ShopStack = createNativeStackNavigator<ShopStackParamList>();

const screenOptions = {
  headerShadowVisible: false,
  headerStyle: { backgroundColor: "#FFF9F1" },
  headerTitleStyle: { color: "#1F2937", fontWeight: "700" as const },
  contentStyle: { backgroundColor: "#FFF9F1" },
};

function useSessionReset() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const resetCart = useCartStore((state) => state.resetCart);
  const clearPrices = usePriceStore((state) => state.clear);

  return () => {
    clearSession();
    resetCart();
    clearPrices();
  };
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={screenOptions}>
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
    </AuthStack.Navigator>
  );
}

function AdminNavigator() {
  const logout = useSessionReset();

  return (
    <AdminStack.Navigator screenOptions={screenOptions}>
      <AdminStack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          title: "Admin Dashboard",
          headerRight: () => <Button label="Logout" onPress={logout} variant="secondary" size="sm" />,
        }}
      />
    </AdminStack.Navigator>
  );
}

function ShopNavigator() {
  const { bootstrap, loading, error, refresh } = useShopBootstrap();
  const logout = useSessionReset();

  if (loading && !bootstrap) {
    return <LoadingState fullscreen label="Preparing today's shop workspace..." />;
  }

  if (error && !bootstrap) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-cream px-6">
        <Text className="text-center text-base text-ink">{error}</Text>
        <Button label="Retry" onPress={() => void refresh()} />
        <Button label="Logout" onPress={logout} variant="secondary" />
      </View>
    );
  }

  return (
    <ShopStack.Navigator
      key={bootstrap?.prices_set ? "priced" : "unpriced"}
      initialRouteName={bootstrap?.prices_set ? "Billing" : "DailyPriceSetup"}
      screenOptions={screenOptions}
    >
      <ShopStack.Screen
        name="DailyPriceSetup"
        component={DailyPriceSetupScreen}
        options={{
          title: "Daily Price Setup",
          headerBackVisible: false,
          headerRight: () => <Button label="Logout" onPress={logout} variant="secondary" size="sm" />,
        }}
      />
      <ShopStack.Screen
        name="Billing"
        component={BillingScreen}
        options={{
          title: bootstrap?.shop_name ?? "Billing",
          headerRight: () => <Button label="Logout" onPress={logout} variant="secondary" size="sm" />,
        }}
      />
      <ShopStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: "Checkout" }} />
      <ShopStack.Screen name="Receipt" component={ReceiptScreen} options={{ title: "Receipt" }} />
    </ShopStack.Navigator>
  );
}

export function AppNavigator() {
  const hydrated = useAuthHydration();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!token || !user) {
      useCartStore.getState().resetCart();
      usePriceStore.getState().clear();
    }
  }, [hydrated, token, user]);

  if (!hydrated) {
    return <LoadingState fullscreen label="Restoring secure session..." />;
  }

  if (!token || !user) {
    return <AuthNavigator />;
  }

  return user.role === "admin" ? <AdminNavigator /> : <ShopNavigator />;
}
