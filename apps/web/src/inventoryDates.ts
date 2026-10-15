/** UTC calendar day match for "created today" KPI (demo inventory). */
export function isCreatedTodayUtc(iso: string, now: Date = new Date()): boolean {
  const d = new Date(iso);
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate()
  );
}
