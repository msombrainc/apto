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

test("filter bar flex layout avoids overlap (apto#121)", () => {
  assert.match(css, /\.filter-bar\s*\{[^}]*align-items:\s*flex-end/);
  assert.match(css, /\.filter-bar\s*\{[^}]*flex-wrap:\s*wrap/);
  assert.doesNotMatch(
    css,
    /\.dashboard-panel:has\(\.data-table-wrap\)\s+\.filter-bar\s*\{[^}]*max-height:/,
  );
});
