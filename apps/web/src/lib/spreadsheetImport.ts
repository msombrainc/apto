import { escapeCsv } from "../jobsListExport";

export const MAX_IMPORT_ROWS = 500;

export type ImportField = "serialNumber" | "partNumber" | "category" | "grade";

export type ColumnMapping = Partial<Record<ImportField, string>>;

export type ParsedSheet = {
  headers: string[];
  rows: string[][];
};

export type RowValidationContext = {
  gradeCodes: Set<string>;
  categoryNames: Set<string>;
  serialsInFile: Map<string, number[]>;
  lookupSerial: (serial: string) => Promise<boolean>;
  resolvePartNumber: (part: string) => Promise<{ id: string } | null>;
  unknownPartPolicy: "create" | "skip";
};

export type ValidatedRow = {
  index: number;
  serialNumber: string;
  partNumber: string;
  category: string;
  grade: string;
  status: "ok" | "error" | "skipped";
  messages: string[];
};

const HEADER_ALIASES: Record<ImportField, string[]> = {
  serialNumber: ["serial", "serial number", "serialnumber", "sn"],
  partNumber: ["part", "part number", "partnumber", "pn", "sku"],
  category: ["category", "cat"],
  grade: ["grade"],
};

export function parseCsvText(text: string): ParsedSheet {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }
  const rows = lines.map(parseCsvLine);
  const headers = rows[0].map((h) => h.trim());
  const data = rows.slice(1).filter((r) => r.some((c) => c.trim().length > 0));
  return { headers, rows: data };
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

export function guessColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const normalized = headers.map((h) => h.trim().toLowerCase());
  for (const field of Object.keys(HEADER_ALIASES) as ImportField[]) {
    const aliases = HEADER_ALIASES[field];
    const idx = normalized.findIndex((h) => aliases.includes(h) || aliases.some((a) => h.includes(a)));
    if (idx >= 0) {
      mapping[field] = headers[idx];
    }
  }
  return mapping;
}

function cellValue(row: string[], headers: string[], columnName?: string): string {
  if (!columnName) return "";
  const idx = headers.indexOf(columnName);
  if (idx < 0) return "";
  return (row[idx] ?? "").trim();
}

export function buildSerialIndex(
  sheet: ParsedSheet,
  mapping: ColumnMapping,
): Map<string, number[]> {
  const map = new Map<string, number[]>();
  sheet.rows.forEach((row, index) => {
    const serial = cellValue(row, sheet.headers, mapping.serialNumber);
    if (!serial) return;
    const key = serial.toLowerCase();
    const list = map.get(key) ?? [];
    list.push(index);
    map.set(key, list);
  });
  return map;
}

export async function validateImportRows(
  sheet: ParsedSheet,
  mapping: ColumnMapping,
  ctx: RowValidationContext,
): Promise<ValidatedRow[]> {
  if (sheet.rows.length > MAX_IMPORT_ROWS) {
    throw new Error(`File has ${sheet.rows.length} rows; maximum is ${MAX_IMPORT_ROWS}.`);
  }

  const results: ValidatedRow[] = [];
  for (let index = 0; index < sheet.rows.length; index++) {
    const row = sheet.rows[index];
    const serialNumber = cellValue(row, sheet.headers, mapping.serialNumber);
    const partNumber = cellValue(row, sheet.headers, mapping.partNumber);
    const category = cellValue(row, sheet.headers, mapping.category);
    const grade = cellValue(row, sheet.headers, mapping.grade);
    const messages: string[] = [];

    if (!mapping.partNumber) {
      messages.push("Part number column not mapped.");
    } else if (!partNumber) {
      messages.push("Part number is required.");
    }

    if (grade && !ctx.gradeCodes.has(grade.toLowerCase())) {
      messages.push(`Unknown grade "${grade}".`);
    }
    if (category && !ctx.categoryNames.has(category.toLowerCase())) {
      messages.push(`Unknown category "${category}".`);
    }

    if (serialNumber) {
      const dupes = ctx.serialsInFile.get(serialNumber.toLowerCase());
      if (dupes && dupes.length > 1) {
        messages.push("Duplicate serial in file.");
      }
      try {
        const exists = await ctx.lookupSerial(serialNumber);
        if (exists) {
          messages.push("Serial already exists in AIMS.");
        }
      } catch {
        messages.push("Could not verify serial uniqueness.");
      }
    }

    let status: ValidatedRow["status"] = messages.length === 0 ? "ok" : "error";

    if (status === "ok" && partNumber) {
      const found = await ctx.resolvePartNumber(partNumber);
      if (!found) {
        if (ctx.unknownPartPolicy === "skip") {
          status = "skipped";
          messages.push("Unknown part number (skipped).");
        }
      }
    }

    results.push({
      index,
      serialNumber,
      partNumber,
      category,
      grade,
      status,
      messages,
    });
  }
  return results;
}

export function failedRowsCsv(rows: ValidatedRow[]): string {
  const header = "row,serial,partNumber,category,grade,status,messages";
  const lines = rows.map((r) =>
    [
      String(r.index + 2),
      escapeCsv(r.serialNumber),
      escapeCsv(r.partNumber),
      escapeCsv(r.category),
      escapeCsv(r.grade),
      r.status,
      escapeCsv(r.messages.join("; ")),
    ].join(","),
  );
  return [header, ...lines].join("\n");
}
