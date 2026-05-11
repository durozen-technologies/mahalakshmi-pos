import { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";

import { login } from "@/api/auth";
import { toApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { SectionHeading } from "@/components/ui/section-heading";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { usePriceStore } from "@/store/price-store";

export function LoginScreen() {
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const setSession = useAuthStore((state) => state.setSession);
  const resetCart = useCartStore((state) => state.resetCart);
  const clearPrices = usePriceStore((state) => state.clear);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Login failed", "Username and password are required.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await login({ username, password });
      resetCart();
      clearPrices();
      setSession(response.access_token, response.user);
    } catch (error) {
      console.error("login error:", error);
      Alert.alert("Login failed", toApiError(error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <Screen>
        <View className="gap-6 pt-3">
          <Card className="gap-5">
            <View className="gap-4">
              <SectionHeading
                eyebrow="Secure Access"
                title="Sign in to continue"
                subtitle="Use the credentials issued from the backend to enter the billing or admin workspace."
              />
              <View className="gap-2.5">
                <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-muted">Username</Text>
                <View className="rounded-[24px] border border-border bg-surface px-4">
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="Enter username"
                    placeholderTextColor="#95A293"
                    value={username}
                    onChangeText={setUsername}
                    className="min-h-[58px] text-base text-ink"
                  />
                </View>
              </View>
              <View className="gap-2.5">
                <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-muted">Password</Text>
                <View className="rounded-[24px] border border-border bg-surface px-4">
                  <TextInput
                    secureTextEntry
                    autoCorrect={false}
                    placeholder="Enter password"
                    placeholderTextColor="#95A293"
                    value={password}
                    onChangeText={setPassword}
                    className="min-h-[58px] text-base text-ink"
                  />
                </View>
              </View>
              <Button label="Enter Workspace" onPress={handleLogin} loading={submitting} />
              <View className="rounded-[24px] border border-border bg-surface px-4 py-4">
                <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-muted">First-time setup</Text>
                <Text className="mt-2 text-sm leading-6 text-muted">
                  Create the first admin account from the backend, then sign in here to manage shops and sales.
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
