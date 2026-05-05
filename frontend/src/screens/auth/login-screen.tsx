import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { login } from "@/api/auth";
import { toApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { SectionHeading } from "@/components/ui/section-heading";
import { TextField } from "@/components/ui/text-field";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { usePriceStore } from "@/store/price-store";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const [submitting, setSubmitting] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const resetCart = useCartStore((state) => state.resetCart);
  const clearPrices = usePriceStore((state) => state.clear);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  async function handleLogin(values: LoginFormValues) {
    setSubmitting(true);
    try {
      const response = await login(values);
      // console.log("login response:", response);
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <Screen>
        <View className="gap-6 pt-4">
          <View className="gap-3">
            <Text className="text-sm font-semibold uppercase tracking-[2px] text-accent">
              Meat Billing POS
            </Text>
            <Text className="text-[32px] font-bold leading-[40px] text-ink">
              Fast counter billing for admin and shop users.
            </Text>
            <Text className="text-base leading-7 text-muted">
              Sign in to continue, or create the first admin account if this is a fresh setup.
            </Text>
          </View>

          <Card className="gap-4">
            <View className="gap-4">
              <SectionHeading
                title="Unified Login"
                subtitle="Use admin or shop credentials from the backend."
              />
              <Controller
                control={loginForm.control}
                name="username"
                render={({ field, fieldState }) => (
                  <TextField
                    label="Username"
                    autoCapitalize="none"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                control={loginForm.control}
                name="password"
                render={({ field, fieldState }) => (
                  <TextField
                    label="Password"
                    secureTextEntry
                    value={field.value}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Button
                label="Continue"
                onPress={loginForm.handleSubmit(handleLogin)}
                loading={submitting}
              />
            </View>
          </Card>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
