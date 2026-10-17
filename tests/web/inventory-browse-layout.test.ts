import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { INVENTORY_COLUMN_LABELS } from "../../apps/web/src/inventoryListColumns.ts";

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

const inventoryColumnsTs = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../../apps/web/src/inventoryListColumns.ts",
  ),
  "utf8",
);

test("inventory column chooser uses human labels (apto#107 / apto#116)", () => {
  for (const [id, label] of Object.entries(INVENTORY_COLUMN_LABELS)) {
    assert.notEqual(label, id);
    assert.match(inventoryColumnsTs, new RegExp(`${id}:\\s*"${label.replace("#", "\\#")}"`));
  }
  assert.match(inventoryTsx, /INVENTORY_COLUMN_LABELS\[id\]/);
  assert.match(inventoryTsx, /INVENTORY_COLUMN_LABELS\[col\.id\]/);
  assert.doesNotMatch(inventoryTsx, /<fieldset className="inventory-column-chooser"/);
});

test("inventory account filter lives in FilterBar with filter-bar__select (apto#107)", () => {
  assert.match(inventoryTsx, /<FilterBar[\s\S]*filter-bar__select[\s\S]*inventory-account-filter/);
  assert.match(inventoryTsx, /className="aims-select"/);
});

test("inventory filter row uses horizontal wrap layout (apto#116)", () => {
  assert.match(css, /\.inventory-filters-row\s*\{[^}]*flex-direction:\s*row/);
  assert.match(css, /\.inventory-filters-row\s*\{[^}]*flex-wrap:\s*wrap/);
});
