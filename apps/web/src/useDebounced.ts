import { useEffect, useState } from "react";
import { debounceSchedule } from "./debounceSchedule";

export function useDebounced<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const { schedule, cancel } = debounceSchedule(delayMs, () => setDebounced(value));
    schedule();
    return cancel;
  }, [value, delayMs]);
  return debounced;
}
