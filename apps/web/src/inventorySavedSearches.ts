import type { InventoryListParams } from "./inventoryListParams";
import { downloadCsvFile, escapeCsv } from "./jobsListExport";

export type SavedInventorySearch = {
  id: string;
  name: string;
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

export type InventoryCsvRow = {
  aptoId: string;
  serialNumber: string | null;
  partNumber: string | null;
  categoryName: string | null;
  grade: string | null;
  status: string | null;
  locationName: string | null;
  accountName: string;
  facilityCode: string | null;
  jobId: string;
  createdAtUtc: string;
};

const CSV_HEADERS = [
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

export function buildInventoryCsv(rows: InventoryCsvRow[]): string {
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
      .map((c) => escapeCsv(String(c)))
      .join(","),
  );
  return [CSV_HEADERS.join(","), ...lines].join("\n");
}

export function exportInventoryCsv(rows: InventoryCsvRow[]): void {
  downloadCsvFile(
    buildInventoryCsv(rows),
    `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`,
  );
}
