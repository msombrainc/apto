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
  assert.match(css, /\.aims-app\s*\{[^}]*position:\s*fixed/);
  assert.match(css, /\.aims-app\s*\{[^}]*inset:\s*0/);
  assert.match(css, /\.aims-app\s*\{[^}]*height:\s*100%/);
  assert.match(css, /\.aims-app\s*\{[^}]*overflow:\s*hidden/);
  assert.match(css, /\.page-content\s*\{[^}]*overflow:\s*hidden/);
  assert.match(
    css,
    /\.page-content:has\(> \.dashboard-stack\)\s*\{[^}]*display:\s*flex/,
  );
  assert.match(
    css,
    /\.page-content:not\(:has\(> \.dashboard-stack\)\)\s*\{[^}]*overflow-y:\s*auto/,
  );
  assert.match(css, /html:has\(\.aims-app\)[^}]*overflow:\s*hidden/);
  assert.match(css, /html:has\(\.aims-app\)[^}]*max-height:\s*100%/);
  assert.match(
    css,
    /\.dashboard-panel:has\(\.data-table-wrap\)\s+\.data-table-wrap\s*\{[^}]*overflow:\s*auto/,
  );
  assert.match(
    css,
    /\.dashboard-panel:has\(\.data-table-wrap\)\s+\.data-table-wrap\s*\{[^}]*overscroll-behavior:\s*contain/,
  );
  assert.match(css, /\.aims-main\s*\{[^}]*overscroll-behavior:\s*none/);
  assert.match(css, /\.page-content\s*\{[^}]*overscroll-behavior:\s*none/);
  assert.match(
    css,
    /\.dashboard-panel:has\(\.data-table-wrap\)\s*\{[^}]*overflow:\s*hidden/,
  );
  assert.doesNotMatch(
    css,
    /\.data-table-wrap\s*\{[^}]*max-height:\s*min\(70vh/,
  );
});

test("mobile breakpoint resets fixed shell heights (apto#107)", () => {
  const mobileBlock = css.match(/@media \(max-width: 768px\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(mobileBlock, "expected mobile media query");
  const block = mobileBlock[1];
  assert.match(block, /\.aims-app\s*\{[^}]*position:\s*relative/);
  assert.match(block, /\.aims-app\s*\{[^}]*height:\s*auto/);
  assert.match(block, /\.aims-sidebar\s*\{[^}]*height:\s*auto/);
  assert.match(block, /\.aims-main\s*\{[^}]*height:\s*auto/);
});
test("dark data tables use elevated header + link tokens (apto#107)", () => {
  assert.match(css, /--aims-table-header:\s*#d1dae8/);
  assert.match(css, /--aims-link:\s*#ffc49a/);
  assert.match(css, /\.data-table th\s*\{[^}]*color:\s*var\(--aims-table-header/);
  assert.match(
    css,
    /\[data-theme="light"\]\s*\.data-table th\s*\{[^}]*color:\s*var\(--aims-text-muted\)/,
  );
  assert.match(css, /\.modal-form input,\s*\n\.modal-form select/);
  assert.match(css, /\.modal-form \.aims-select/);
});

test("AppShell installs document scroll lock helper (apto#112)", () => {
  const shellPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "../../apps/web/src/AppShell.tsx",
  );
  const src = readFileSync(shellPath, "utf8");
  assert.match(src, /installDocumentScrollLock/);
  assert.match(src, /useEffect\(\(\)\s*=>\s*installDocumentScrollLock\(\)/);
});
