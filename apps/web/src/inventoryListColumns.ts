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
