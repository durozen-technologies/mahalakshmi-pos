import { useAuthStore } from "@/store/auth-store";

export function useAuthHydration() {
  return useAuthStore((state) => state.hydrated);
}
