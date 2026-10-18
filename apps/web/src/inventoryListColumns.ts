export type InventoryListColumnId =
  | "apto"
  | "serial"
  | "part"
  | "category"
  | "grade"
  | "status"
  | "location"
  | "account"
  | "facility"
  | "job"
  | "created";

export const INVENTORY_COLUMN_IDS: InventoryListColumnId[] = [
  "apto",
  "serial",
  "part",
  "category",
  "grade",
  "status",
  "location",
  "account",
  "facility",
  "job",
  "created",
];

/** Compact preview SoT default (apto#125 pass 10) — matches authenticated preview table headers. */
export const INVENTORY_PREVIEW_DEFAULT_COLUMNS: InventoryListColumnId[] = [
  "apto",
  "serial",
  "part",
  "grade",
  "status",
  "account",
];

/** Keep preview SoT columns when restoring saved searches (apto#125 pass 11). */
export function normalizePreviewInventoryColumns(
  columns: string[],
): InventoryListColumnId[] {
  const allowed = new Set(INVENTORY_COLUMN_IDS);
  const preview = INVENTORY_PREVIEW_DEFAULT_COLUMNS.filter((id) => columns.includes(id));
  if (preview.length === INVENTORY_PREVIEW_DEFAULT_COLUMNS.length) {
    return [...INVENTORY_PREVIEW_DEFAULT_COLUMNS];
  }
  const filtered = columns.filter(
    (c): c is InventoryListColumnId => allowed.has(c as InventoryListColumnId),
  );
  return filtered.length > 0 ? filtered : [...INVENTORY_PREVIEW_DEFAULT_COLUMNS];
}

export const INVENTORY_COLUMN_LABELS: Record<InventoryListColumnId, string> = {
  apto: "APTO",
  serial: "Serial",
  part: "Part number",
  category: "Category",
  grade: "Grade",
  status: "Status",
  location: "Location",
  account: "Account",
  facility: "Facility",
  job: "Job",
  created: "Created",
};
