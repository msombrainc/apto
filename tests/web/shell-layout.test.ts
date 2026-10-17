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

test("app shell uses full-viewport grid with hidden overflow (apto#107)", () => {
  assert.match(css, /\.aims-app\s*\{[^}]*height:\s*100vh/);
  assert.match(css, /\.aims-app\s*\{[^}]*overflow:\s*hidden/);
  assert.match(css, /\.page-content\s*\{[^}]*overflow-y:\s*auto/);
  assert.match(css, /html:has\(\.aims-app\)[^}]*overflow:\s*hidden/);
  assert.match(
    css,
    /\.dashboard-panel:has\(\.data-table-wrap\)\s+\.data-table-wrap\s*\{[^}]*overflow:\s*auto/,
  );
});

test("mobile breakpoint resets fixed shell heights (apto#107)", () => {
  const mobileBlock = css.match(/@media \(max-width: 768px\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(mobileBlock, "expected mobile media query");
  const block = mobileBlock[1];
  assert.match(block, /\.aims-app\s*\{[^}]*height:\s*auto/);
  assert.match(block, /\.aims-sidebar\s*\{[^}]*height:\s*auto/);
  assert.match(block, /\.aims-main\s*\{[^}]*height:\s*auto/);
});
