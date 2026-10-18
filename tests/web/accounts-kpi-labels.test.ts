import test from "node:test";
import assert from "node:assert/strict";
import { accountsKpiSublabel } from "../../apps/web/src/accountsKpiLabels.ts";

test("accountsKpiSublabel (apto#125 pass 4)", () => {
  assert.equal(accountsKpiSublabel("Active", ""), "Active customers");
  assert.equal(accountsKpiSublabel("Active", "  "), "Active customers");
  assert.equal(accountsKpiSublabel("Active", "acme"), "Matching search");
  assert.equal(accountsKpiSublabel("Inactive", ""), "Inactive records");
  assert.equal(accountsKpiSublabel("Both", ""), "All records");
  assert.equal(accountsKpiSublabel("Both", "x"), "Matching search");
});
