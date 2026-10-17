import test from "node:test";
import assert from "node:assert/strict";
import {
  AIMS_MODULE_MAP,
  moduleGroups,
  isKnownAppPath,
  parseAccountId,
  parseJobId,
  parseJobBulkUnserialized,
  parseJobCertificate,
  parseJobInvoice,
  parseJobSpreadsheetImport,
  parseInventoryAssetId,
  viewFromPathname,
} from "../../apps/web/src/routing/moduleMap.ts";
import {
  ROUTES,
  accountPath,
  inventoryAssetPath,
  jobPath,
  jobBulkUnserializedPath,
  jobCertificatePath,
  jobInvoicePath,
  jobSpreadsheetImportPath,
} from "../../apps/web/src/routing/paths.ts";

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

test("sla-dashboard module and route (F5)", () => {
  const sla = AIMS_MODULE_MAP.find((e) => e.id === "sla-dashboard");
  assert.equal(sla?.path, "/operations/sla-dashboard");
  const dashSla = AIMS_MODULE_MAP.find((e) => e.id === "sla-dash");
  assert.equal(dashSla?.path, "/operations/sla-dashboard");
  assert.equal(viewFromPathname("/operations/sla-dashboard"), "sla-dashboard");
  assert.equal(isKnownAppPath("/operations/sla-dashboard"), true);
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

test("jobPath round-trips with parseJobId", () => {
  const id = "job/with space";
  assert.equal(parseJobId(jobPath(id)), id);
});

test("jobSpreadsheetImportPath round-trips with parseJobSpreadsheetImport", () => {
  const id = "job-54";
  const path = jobSpreadsheetImportPath(id);
  assert.equal(parseJobSpreadsheetImport(path), id);
  assert.equal(parseJobId(path), id);
});

test("jobBulkUnserializedPath round-trips with parseJobBulkUnserialized", () => {
  const id = "job-55";
  const path = jobBulkUnserializedPath(id);
  assert.equal(parseJobBulkUnserialized(path), id);
  assert.equal(parseJobId(path), id);
});

test("jobCertificatePath round-trips with parseJobCertificate", () => {
  const id = "job-58";
  const path = jobCertificatePath(id);
  assert.equal(parseJobCertificate(path), id);
  assert.equal(parseJobId(path), id);
});

test("jobInvoicePath round-trips with parseJobInvoice", () => {
  const id = "job-59";
  const path = jobInvoicePath(id);
  assert.equal(parseJobInvoice(path), id);
  assert.equal(parseJobId(path), id);
});

test("parseInventoryAssetId decodes asset segment", () => {
  assert.equal(parseInventoryAssetId("/inventory/assets/asset%2F1"), "asset/1");
  assert.equal(parseInventoryAssetId("/inventory"), null);
});

test("F15 prototype modules and routes (apto#60)", () => {
  const userMgmt = AIMS_MODULE_MAP.find((e) => e.id === "user-mgmt");
  assert.equal(userMgmt?.availability, "prototype");
  assert.equal(userMgmt?.path, ROUTES.userManagement);

  const fulfillment = AIMS_MODULE_MAP.find((e) => e.id === "order-fulfillment");
  assert.equal(fulfillment?.path, ROUTES.orderFulfillment);

  const production = AIMS_MODULE_MAP.find((e) => e.id === "production");
  assert.equal(production?.path, ROUTES.productionDashboard);

  const assetImages = AIMS_MODULE_MAP.find((e) => e.id === "asset-images");
  assert.equal(assetImages?.path, ROUTES.assetImages);

  assert.equal(viewFromPathname("/admin/user-management"), "user-management");
  assert.equal(viewFromPathname("/operations/order-fulfillment"), "order-fulfillment");
  assert.equal(viewFromPathname("/dashboards/production"), "production-dashboard");
  assert.equal(viewFromPathname("/inventory/asset-images"), "asset-images");

  assert.equal(isKnownAppPath("/admin/user-management"), true);
  assert.equal(isKnownAppPath("/operations/order-fulfillment"), true);
  assert.equal(isKnownAppPath("/dashboards/production"), true);
  assert.equal(isKnownAppPath("/inventory/asset-images"), true);
});
