import test from "node:test";
import assert from "node:assert/strict";
import { classifyFulfillmentScan } from "../../apps/web/src/fulfillmentScanLogic.ts";

const invoiceIds = new Set(["APT-001", "APT-002"]);

test("classifyFulfillmentScan — empty input", () => {
  assert.equal(classifyFulfillmentScan("  ", invoiceIds, new Set()), "empty");
});

test("classifyFulfillmentScan — not on invoice", () => {
  assert.equal(
    classifyFulfillmentScan("apt-999", invoiceIds, new Set()),
    "not-on-invoice",
  );
});

test("classifyFulfillmentScan — already scanned", () => {
  assert.equal(
    classifyFulfillmentScan("apt-001", invoiceIds, new Set(["APT-001"])),
    "already-scanned",
  );
});

test("classifyFulfillmentScan — match (normalizes case)", () => {
  assert.equal(
    classifyFulfillmentScan("apt-002", invoiceIds, new Set()),
    "match",
  );
});
