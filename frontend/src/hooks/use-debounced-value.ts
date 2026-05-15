import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delay = 180) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
}
