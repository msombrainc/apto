import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  INVENTORY_PREVIEW_DEFAULT_COLUMNS,
} from "../../apps/web/src/inventoryListColumns.ts";
import {
  PREVIEW_JOBS_LIST_COLUMNS,
  JOBS_LIST_COLUMN_LABELS,
} from "../../apps/web/src/jobsListColumns.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

test("login light theme keeps dark hero (apto#125)", () => {
  const css = read("apps/web/src/styles.css");
  assert.match(css, /\[data-theme="light"\]\s*\.login-hero\s*\{[^}]*#0c1118/);
});

test("App page titles match preview charter (apto#125)", () => {
  const app = read("apps/web/src/App.tsx");
  assert.match(app, /view === "jobs"\s*\?\s*"Jobs & SLA"/);
  assert.match(app, /:\s*"Inventory"/);
  assert.doesNotMatch(app, /"Inventory browse"/);
});

test("inventory preview default columns are compact six (apto#125)", () => {
  assert.deepEqual(INVENTORY_PREVIEW_DEFAULT_COLUMNS, [
    "apto",
    "serial",
    "part",
    "grade",
    "status",
    "account",
  ]);
  const app = read("apps/web/src/App.tsx");
  assert.match(app, /INVENTORY_PREVIEW_DEFAULT_COLUMNS/);
});

test("jobs preview default columns match charter headers (apto#125)", () => {
  assert.deepEqual(PREVIEW_JOBS_LIST_COLUMNS, [
    "account",
    "facility",
    "opsStatus",
    "dueDateUtc",
    "slaDaysRemaining",
    "slaStatus",
  ]);
  assert.equal(JOBS_LIST_COLUMN_LABELS.slaDaysRemaining, "Days left");
  assert.equal(JOBS_LIST_COLUMN_LABELS.dueDateUtc, "Deadline");
  assert.equal(JOBS_LIST_COLUMN_LABELS.slaStatus, "Status");
});

test("accounts table uses SLA segment bar not numeric SLA cols (apto#125)", () => {
  const accounts = read("apps/web/src/components/aims/AccountsDashboard.tsx");
  assert.match(accounts, /SlaSegmentBar/);
  assert.doesNotMatch(accounts, /header: "Input SLA"/);
  assert.doesNotMatch(accounts, /header: "Apto %"/);
});

test("AppShell can hide global asset lookup on list surfaces (apto#125)", () => {
  const shell = read("apps/web/src/AppShell.tsx");
  assert.match(shell, /showGlobalLookup/);
  const app = read("apps/web/src/App.tsx");
  assert.match(app, /hideGlobalLookup/);
  assert.match(app, /showGlobalLookup=\{!hideGlobalLookup\}/);
});
