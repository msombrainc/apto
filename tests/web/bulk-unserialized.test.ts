import test from "node:test";
import assert from "node:assert/strict";
import {
  createdAptoIdsCsv,
  parseBulkQuantity,
  MAX_BULK_QUANTITY,
  MIN_BULK_QUANTITY,
} from "../../apps/web/src/lib/bulkUnserialized.ts";

test("parseBulkQuantity accepts 1–500 integers only", () => {
  assert.equal(parseBulkQuantity("1"), MIN_BULK_QUANTITY);
  assert.equal(parseBulkQuantity("500"), MAX_BULK_QUANTITY);
  assert.equal(parseBulkQuantity("0"), null);
  assert.equal(parseBulkQuantity("501"), null);
  assert.equal(parseBulkQuantity("10.5"), null);
  assert.equal(parseBulkQuantity(""), null);
});

test("createdAptoIdsCsv escapes values", () => {
  const csv = createdAptoIdsCsv(['A0001', 'say "hi"']);
  assert.match(csv, /^aptoId/);
  assert.match(csv, /"say ""hi"""/);
});
