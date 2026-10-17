import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const stylesPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../apps/web/src/styles.css",
);
const css = readFileSync(stylesPath, "utf8");

const inventoryTsx = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../../apps/web/src/components/aims/InventoryDashboard.tsx",
  ),
  "utf8",
);

const INVENTORY_COLUMN_LABELS: Record<string, string> = {
  apto: "Apto ID",
  serial: "Serial",
  part: "Part #",
  category: "Category",
  grade: "Grade",
  status: "Status",
  location: "Location",
  account: "Account",
  facility: "Facility",
  job: "Job",
  created: "Created",
};

test("inventory column chooser uses human labels (apto#107 / apto#116)", () => {
  for (const [id, label] of Object.entries(INVENTORY_COLUMN_LABELS)) {
    assert.notEqual(label, id);
    assert.match(inventoryTsx, new RegExp(`${id}:\\s*"${label.replace("#", "#")}"`));
  }
  assert.match(inventoryTsx, /INVENTORY_COLUMN_LABELS\[id\]/);
  assert.doesNotMatch(inventoryTsx, /<fieldset className="inventory-column-chooser"/);
});

test("inventory filter row uses horizontal wrap layout (apto#116)", () => {
  assert.match(css, /\.inventory-filters-row\s*\{[^}]*flex-direction:\s*row/);
  assert.match(css, /\.inventory-filters-row\s*\{[^}]*flex-wrap:\s*wrap/);
});
