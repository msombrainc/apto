import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  INVENTORY_COLUMN_IDS,
  INVENTORY_COLUMN_LABELS,
} from "../../apps/web/src/components/aims/InventoryDashboard.tsx";

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

test("inventory column chooser uses human labels (apto#107 / apto#116)", () => {
  for (const id of INVENTORY_COLUMN_IDS) {
    assert.ok(INVENTORY_COLUMN_LABELS[id], `label for ${id}`);
    assert.notEqual(INVENTORY_COLUMN_LABELS[id], id);
  }
  assert.match(inventoryTsx, /INVENTORY_COLUMN_LABELS\[id\]/);
  assert.doesNotMatch(inventoryTsx, /<fieldset className="inventory-column-chooser"/);
});

test("inventory filter row uses horizontal wrap layout (apto#116)", () => {
  assert.match(css, /\.inventory-filters-row\s*\{[^}]*flex-direction:\s*row/);
  assert.match(css, /\.inventory-filters-row\s*\{[^}]*flex-wrap:\s*wrap/);
});
