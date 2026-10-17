import type { InventoryListParams } from "./inventoryListParams";

export type SavedInventorySearch = {
  id: string;
  name: string;
  isDefault?: boolean;
  params: Omit<InventoryListParams, "page">;
  visibleColumns: string[];
};

const STORAGE_KEY = "apto-inventory-saved-searches-v1";

export function loadSavedInventorySearches(): SavedInventorySearch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedInventorySearch[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistSavedInventorySearches(searches: SavedInventorySearch[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
}

export function exportInventoryCsv(
  rows: { aptoId: string; serialNumber: string | null; partNumber: string | null; categoryName: string | null; grade: string | null; status: string | null; locationName: string | null; accountName: string; facilityCode: string | null; jobId: string; createdAtUtc: string }[],
): void {
  const header = [
    "Apto ID",
    "Serial",
    "Part #",
    "Category",
    "Grade",
    "Status",
    "Location",
    "Account",
    "Facility",
    "Job ID",
    "Created",
  ];
  const lines = rows.map((r) =>
    [
      r.aptoId,
      r.serialNumber ?? "",
      r.partNumber ?? "",
      r.categoryName ?? "",
      r.grade ?? "",
      r.status ?? "",
      r.locationName ?? "",
      r.accountName,
      r.facilityCode ?? "",
      r.jobId,
      r.createdAtUtc,
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(","),
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
