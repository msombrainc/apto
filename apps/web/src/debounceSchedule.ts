/** Pure debounce timer contract used by useDebounced (tested without DOM). */
export function debounceSchedule(
  delayMs: number,
  onFire: () => void,
): { schedule: () => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };
  const schedule = () => {
    cancel();
    timer = setTimeout(() => {
      timer = undefined;
      onFire();
    }, delayMs);
  };
  return { schedule, cancel };
}
