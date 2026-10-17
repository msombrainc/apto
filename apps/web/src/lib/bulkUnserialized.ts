import { escapeCsv } from "../jobsListExport";

export const MIN_BULK_QUANTITY = 1;
export const MAX_BULK_QUANTITY = 500;
export const UNIDENTIFIED_PART_NUMBER = "UNIDENTIFIED";

export function parseBulkQuantity(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n) || String(n) !== trimmed) return null;
  if (n < MIN_BULK_QUANTITY || n > MAX_BULK_QUANTITY) return null;
  return n;
}

export function createdAptoIdsCsv(aptoIds: string[]): string {
  const header = "aptoId";
  const rows = aptoIds.map((id) => escapeCsv(id));
  return [header, ...rows].join("\n");
}
