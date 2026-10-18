export type AccountStatusFilter = "Active" | "Inactive" | "Both";

export function accountsKpiLabel(statusFilter: AccountStatusFilter): string {
  switch (statusFilter) {
    case "Inactive":
      return "Inactive accounts";
    case "Both":
      return "Accounts";
    default:
      return "Active customers";
  }
}

export function accountsKpiSublabel(
  statusFilter: AccountStatusFilter,
  query: string,
): string | undefined {
  const trimmed = query.trim();
  if (trimmed) return "Matching search";
  if (statusFilter === "Inactive") return "Inactive records";
  if (statusFilter === "Both") return "All records";
  return undefined;
}
