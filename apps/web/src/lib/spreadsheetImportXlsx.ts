import * as XLSX from "xlsx";
import type { ParsedSheet } from "./spreadsheetImport";

export function parseXlsxBuffer(buffer: ArrayBuffer): ParsedSheet {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return { headers: [], rows: [] };
  }
  const sheet = wb.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });
  if (matrix.length === 0) {
    return { headers: [], rows: [] };
  }
  const headers = (matrix[0] ?? []).map((c) => String(c).trim());
  const rows = matrix
    .slice(1)
    .map((r) => headers.map((_, i) => String(r[i] ?? "").trim()))
    .filter((r) => r.some((c) => c.length > 0));
  return { headers, rows };
}
