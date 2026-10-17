import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_IMPORT_ROWS,
  buildSerialIndex,
  guessColumnMapping,
  parseCsvText,
  validateImportRows,
} from "../../apps/web/src/lib/spreadsheetImport.ts";

test("parseCsvText reads header and rows", () => {
  const sheet = parseCsvText("part,serial\nP-1,S1\nP-2,");
  assert.equal(sheet.headers.join(","), "part,serial");
  assert.equal(sheet.rows.length, 2);
  assert.equal(sheet.rows[0][0], "P-1");
});

test("guessColumnMapping matches common headers", () => {
  const mapping = guessColumnMapping(["Serial Number", "Part Number", "Grade"]);
  assert.equal(mapping.serialNumber, "Serial Number");
  assert.equal(mapping.partNumber, "Part Number");
  assert.equal(mapping.grade, "Grade");
});

test("validateImportRows flags duplicate serials in file", async () => {
  const sheet = parseCsvText("part,serial\nP-1,DUP\nP-2,DUP");
  const mapping = guessColumnMapping(sheet.headers);
  const serialsInFile = buildSerialIndex(sheet, mapping);
  const rows = await validateImportRows(sheet, mapping, {
    gradeCodes: new Set(),
    categoryNames: new Set(),
    serialsInFile,
    unknownPartPolicy: "create",
    lookupSerial: async () => false,
    resolvePartNumber: async () => ({ id: "pn-1" }),
  });
  const dupes = rows.filter((r) => r.messages.some((m) => m.includes("Duplicate")));
  assert.equal(dupes.length, 2);
});

test("validateImportRows flags serial already in AIMS", async () => {
  const sheet = parseCsvText("part,serial\nP-1,EXISTING");
  const mapping = guessColumnMapping(sheet.headers);
  const rows = await validateImportRows(sheet, mapping, {
    gradeCodes: new Set(),
    categoryNames: new Set(),
    serialsInFile: buildSerialIndex(sheet, mapping),
    unknownPartPolicy: "create",
    lookupSerial: async () => true,
    resolvePartNumber: async () => ({ id: "pn-1" }),
  });
  assert.ok(rows[0].messages.some((m) => m.includes("already exists")));
});

test("validateImportRows skips unknown parts when policy is skip", async () => {
  const sheet = parseCsvText("part,serial\nNEW-PART,S1");
  const mapping = guessColumnMapping(sheet.headers);
  const rows = await validateImportRows(sheet, mapping, {
    gradeCodes: new Set(),
    categoryNames: new Set(),
    serialsInFile: buildSerialIndex(sheet, mapping),
    unknownPartPolicy: "skip",
    lookupSerial: async () => false,
    resolvePartNumber: async () => null,
  });
  assert.equal(rows[0].status, "skipped");
});

test("validateImportRows rejects files over row cap", async () => {
  const header = "part,serial\n";
  const body = Array.from({ length: MAX_IMPORT_ROWS + 1 }, (_, i) => `P-${i},`).join("\n");
  const sheet = parseCsvText(header + body);
  const mapping = guessColumnMapping(sheet.headers);
  await assert.rejects(
    () =>
      validateImportRows(sheet, mapping, {
        gradeCodes: new Set(),
        categoryNames: new Set(),
        serialsInFile: buildSerialIndex(sheet, mapping),
        unknownPartPolicy: "create",
        lookupSerial: async () => false,
        resolvePartNumber: async () => ({ id: "x" }),
      }),
    /maximum is 500/,
  );
});

test("validateImportRows flags unknown grade", async () => {
  const sheet = parseCsvText("part,serial,grade\nP-1,,BAD");
  const mapping = guessColumnMapping(sheet.headers);
  const rows = await validateImportRows(sheet, mapping, {
    gradeCodes: new Set(["a"]),
    categoryNames: new Set(),
    serialsInFile: buildSerialIndex(sheet, mapping),
    unknownPartPolicy: "create",
    lookupSerial: async () => false,
    resolvePartNumber: async () => ({ id: "pn" }),
  });
  assert.ok(rows[0].messages.some((m) => m.includes("Unknown grade")));
});

test("validateImportRows requires part number", async () => {
  const sheet = parseCsvText("part,serial\n,S1");
  const mapping = guessColumnMapping(sheet.headers);
  const rows = await validateImportRows(sheet, mapping, {
    gradeCodes: new Set(),
    categoryNames: new Set(),
    serialsInFile: buildSerialIndex(sheet, mapping),
    unknownPartPolicy: "create",
    lookupSerial: async () => false,
    resolvePartNumber: async () => null,
  });
  assert.equal(rows[0].status, "error");
});
