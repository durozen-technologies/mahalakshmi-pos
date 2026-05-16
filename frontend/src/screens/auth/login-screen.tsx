import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Store,
  TriangleAlert,
  User2,
} from "lucide-react-native";

import { login } from "@/api/auth";
import { toApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { usePriceStore } from "@/store/price-store";

function collapseWhitespace(value: string) {
  return value.split(/\s+/).filter(Boolean).join(" ");
}

export function LoginScreen() {
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const setSession = useAuthStore((state) => state.setSession);
  const resetCart = useCartStore((state) => state.resetCart);
  const clearPrices = usePriceStore((state) => state.clear);

  async function handleLogin() {
    const normalizedUsername = collapseWhitespace(username);
    const normalizedPassword = password.trim();

    if (!normalizedUsername || !normalizedPassword) {
      setErrorMessage("Username and password are required.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await login({
        username: normalizedUsername,
        password: normalizedPassword,
      });

      resetCart();
      clearPrices();
      setSession(response.access_token, response.user);
    } catch (error) {
      console.error(error);
      setErrorMessage(toApiError(error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#052E16"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
            className="bg-[#04130A]"
          >
            <View className="flex-1">

              {/* TOP GRADIENT SECTION */}

              <View className="relative overflow-hidden bg-[#052E16] px-6 pb-20 pt-16">

                {/* Decorative Glow */}

                <View className="absolute left-[-40px] top-[-30px] h-44 w-44 rounded-full bg-[#22C55E]/20" />

                <View className="absolute right-[-30px] top-16 h-52 w-52 rounded-full bg-[#4ADE80]/10" />

                <View className="absolute bottom-[-50px] left-10 h-36 w-36 rounded-full bg-[#16A34A]/20" />

                {/* Logo */}

                <View className="items-center">

                  <View className="h-24 w-24 items-center justify-center rounded-[32px] border border-white/10 bg-white/10 shadow-2xl">

                    <Store
                      size={42}
                      color="#DCFCE7"
                      strokeWidth={2.4}
                    />
                  </View>

                  <Text className="mt-6 text-center text-4xl font-extrabold tracking-wide text-white">
                    Sri Mahalaksmi
                  </Text>

                  <Text className="mt-1 text-lg font-semibold tracking-[3px] text-[#86EFAC]">
                    BROILERS
                  </Text>

                  <View className="mt-5 flex-row items-center rounded-full border border-[#22C55E]/20 bg-[#14532D]/70 px-4 py-2">

                    <ShieldCheck
                      size={16}
                      color="#86EFAC"
                      strokeWidth={2.3}
                    />

                    <Text className="ml-2 text-xs font-semibold tracking-wide text-[#DCFCE7]">
                      SECURE ADMIN & BILLING PORTAL
                    </Text>
                  </View>
                </View>
              </View>

              {/* LOGIN CARD */}

              <View className="mt-[-45px] flex-1 rounded-t-[38px] bg-[#F8FAF8] px-6 pb-10 pt-8">

                <Text className="text-3xl font-extrabold text-[#111827]">
                  Welcome Back 👋
                </Text>

                <Text className="mt-2 text-base leading-6 text-[#6B7280]">
                  Sign in to manage billing, inventory, reports, pricing, and staff operations.
                </Text>

                {/* USERNAME */}

                <View className="mt-8">

                  <Text className="mb-3 text-[12px] font-bold uppercase tracking-[1.5px] text-[#4B5563]">
                    Username
                  </Text>

                  <View className="flex-row items-center rounded-[24px] border border-[#E5E7EB] bg-white px-5 shadow-sm">

                    <View className="h-11 w-11 items-center justify-center rounded-full bg-[#DCFCE7]">

                      <User2
                        size={20}
                        color="#15803D"
                        strokeWidth={2.4}
                      />
                    </View>

                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="Enter your username"
                      placeholderTextColor="#9CA3AF"
                      value={username}
                      onChangeText={(value) => {
                        setUsername(collapseWhitespace(value));
                        if (errorMessage) setErrorMessage("");
                      }}
                      className="ml-4 flex-1 py-5 text-base font-medium text-[#111827]"
                    />
                  </View>
                </View>

                {/* PASSWORD */}

                <View className="mt-6">

                  <Text className="mb-3 text-[12px] font-bold uppercase tracking-[1.5px] text-[#4B5563]">
                    Password
                  </Text>

                  <View className="flex-row items-center rounded-[24px] border border-[#E5E7EB] bg-white px-5 shadow-sm">

                    <View className="h-11 w-11 items-center justify-center rounded-full bg-[#DCFCE7]">

                      <LockKeyhole
                        size={20}
                        color="#15803D"
                        strokeWidth={2.4}
                      />
                    </View>

                    <TextInput
                      secureTextEntry={!showPassword}
                      autoCorrect={false}
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      className="ml-4 flex-1 py-5 text-base font-medium text-[#111827]"
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />

                    <Pressable
                      onPress={() => setShowPassword((prev) => !prev)}
                      hitSlop={10}
                      className="rounded-full bg-[#F3F4F6] p-3"
                    >
                      {showPassword ? (
                        <EyeOff
                          size={20}
                          color="#4B5563"
                          strokeWidth={2.4}
                        />
                      ) : (
                        <Eye
                          size={20}
                          color="#4B5563"
                          strokeWidth={2.4}
                        />
                      )}
                    </Pressable>
                  </View>
                </View>

                {/* ERROR */}

                {errorMessage ? (
                  <View className="mt-6 flex-row items-start rounded-[22px] border border-red-200 bg-red-50 px-4 py-4">

                    <TriangleAlert
                      size={18}
                      color="#DC2626"
                      strokeWidth={2.4}
                    />

                    <Text className="ml-3 flex-1 text-sm font-semibold leading-5 text-red-700">
                      {errorMessage}
                    </Text>
                  </View>
                ) : null}

                {/* LOGIN BUTTON */}

                <View className="mt-8 overflow-hidden rounded-[24px]">

                  <Button
                    label={submitting ? "Signing In..." : "Enter Workspace"}
                    onPress={handleLogin}
                    loading={submitting}
                  />
                </View>

                {/* FOOTER */}

                <View className="mt-8 items-center">

                  <Text className="text-center text-xs leading-6 text-[#6B7280]">
                    Authorized staff only.
                  </Text>

                  <Text className="text-center text-xs leading-6 text-[#6B7280]">
                    All activities are securely monitored and encrypted.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </>
  );
}