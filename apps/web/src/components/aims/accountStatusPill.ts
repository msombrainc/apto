/** Shared account Active/Inactive pill classes (apto#125). */
export function accountStatusPillClass(status: string): string {
  return status === "Inactive"
    ? "status-pill status-pill--inactive"
    : "status-pill status-pill--active";
}
