import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { StateStorage } from "zustand/middleware";

type WebStorageShape = {
  localStorage?: {
    getItem: (name: string) => string | null;
    setItem: (name: string, value: string) => void;
    removeItem: (name: string) => void;
  };
};

function getWebStorage() {
  return (globalThis as WebStorageShape).localStorage;
}

export const secureStorage: StateStorage = {
  getItem: async (name) => {
    if (Platform.OS === "web") {
      return getWebStorage()?.getItem(name) ?? null;
    }

    return (await SecureStore.getItemAsync(name)) ?? null;
  },
  setItem: async (name, value) => {
    if (Platform.OS === "web") {
      getWebStorage()?.setItem(name, value);
      return;
    }

    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name) => {
    if (Platform.OS === "web") {
      getWebStorage()?.removeItem(name);
      return;
    }

    await SecureStore.deleteItemAsync(name);
  },
};
