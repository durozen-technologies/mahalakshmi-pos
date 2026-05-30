import Constants from "expo-constants";
import "./global.css";

import "./src/navigation/bootstrap";

import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TamaguiProvider } from "tamagui";

import { appTheme } from "@/constants/theme";
import { AppNavigator } from "@/navigation/app-navigator";
import { tamaguiConfig } from "./tamagui.config";

if (__DEV__ && Constants.appOwnership !== "expo") {
  void import("expo-dev-client");
}

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: appTheme.background,
    card: appTheme.card,
    text: appTheme.text,
    border: appTheme.border,
    primary: appTheme.accent,
    notification: appTheme.danger,
  },
};

export default function App() {
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NavigationContainer theme={navigationTheme}>
            <StatusBar style="dark" />
            <AppNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </TamaguiProvider>
  );
}
