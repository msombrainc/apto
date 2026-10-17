import test from "node:test";
import assert from "node:assert/strict";
import {
  AIMS_MODULE_MAP,
  moduleGroups,
  isKnownAppPath,
  parseAccountId,
  parseInventoryAssetId,
  viewFromPathname,
} from "../../apps/web/src/routing/moduleMap.ts";
import { accountPath, inventoryAssetPath } from "../../apps/web/src/routing/paths.ts";

test("module map includes Demo 2 Operations entries", () => {
  const jobs = AIMS_MODULE_MAP.find((e) => e.id === "jobs");
  assert.equal(jobs?.availability, "d2");
  assert.equal(jobs?.path, "/jobs");
});

test("module map marks future screens with phase tags", () => {
  const invoices = AIMS_MODULE_MAP.find((e) => e.id === "invoices");
  assert.equal(invoices?.availability, "future");
  assert.match(invoices?.phaseTag ?? "", /Phase 5/);
});

test("moduleGroups preserves group order", () => {
  const groups = moduleGroups();
  assert.deepEqual(groups.map((g) => g.group), [
    "Operations",
    "Inventory",
    "Accounts & Sales",
    "Admin",
    "Dashboards",
  ]);
});

test("part-numbers module is Demo 2 with admin route", () => {
  const partNumbers = AIMS_MODULE_MAP.find((e) => e.id === "part-numbers");
  assert.equal(partNumbers?.availability, "d2");
  assert.equal(partNumbers?.path, "/admin/part-numbers");
});

test("viewFromPathname maps deep links", () => {
  assert.equal(viewFromPathname("/admin/reference-data"), "reference-data");
  assert.equal(viewFromPathname("/admin/part-numbers"), "part-numbers");
  assert.equal(viewFromPathname("/operations/scan"), "scan");
  assert.equal(viewFromPathname("/inventory/assets/abc"), "inventory");
  assert.equal(viewFromPathname("/accounts"), "accounts");
  assert.equal(parseAccountId("/accounts/abc-123"), "abc-123");
  assert.equal(viewFromPathname("/jobs"), "jobs");
});

test("inventoryAssetPath round-trips with parseInventoryAssetId", () => {
  const id = "asset/with space";
  const path = inventoryAssetPath(id);
  assert.equal(parseInventoryAssetId(path), id);
});

test("isKnownAppPath accepts registered routes and rejects typos", () => {
  assert.equal(isKnownAppPath("/jobs"), true);
  assert.equal(isKnownAppPath("/inventory/assets/x"), true);
  assert.equal(isKnownAppPath("/accounts/abc-123"), true);
  assert.equal(isKnownAppPath("/admin/part-numbers"), true);
  assert.equal(isKnownAppPath("/typo"), false);
});

test("accountPath round-trips with parseAccountId", () => {
  const id = "acct/with space";
  const path = accountPath(id);
  assert.equal(parseAccountId(path), id);
});

test("parseInventoryAssetId decodes asset segment", () => {
  assert.equal(parseInventoryAssetId("/inventory/assets/asset%2F1"), "asset/1");
  assert.equal(parseInventoryAssetId("/inventory"), null);
});
