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

test("list panels separate toolbar from table header zone (apto#139)", () => {
  assert.match(
    css,
    /\.dashboard-panel:has\(\.data-table-wrap\)\s+\.data-table-wrap\s*\{[^}]*border-top:\s*1px solid var\(--aims-border\)/,
  );
  assert.doesNotMatch(
    css,
    /\.dashboard-panel:has\(\.data-table-wrap\)\s+\.filter-bar\s*\{[^}]*position:\s*sticky/,
  );
  assert.doesNotMatch(
    css,
    /\.dashboard-panel:has\(\.data-table-wrap\)\s+\.filter-bar\s*\{[^}]*margin:\s*-1rem/,
  );
});

test("shared paging row layout (apto#139)", () => {
  assert.match(css, /\.inventory-paging[\s\S]*?border-top:\s*1px solid var\(--aims-border\)/);
  assert.match(css, /\.pagination-row[\s\S]*?flex-wrap:\s*wrap/);
});

test("scan code label uses column gap (apto#139)", () => {
  assert.match(css, /\.f8-code-label\s*\{[^}]*flex-direction:\s*column/);
  assert.match(css, /\.f8-code-label\s*\{[^}]*gap:\s*0\.35rem/);
});
