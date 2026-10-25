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

test("filter-bar selects keep 12–14rem width (apto#99 QA RETURN)", () => {
  assert.match(css, /\.filter-bar__select\s*\{[^}]*min-width:\s*12rem/);
  assert.match(
    css,
    /\.filter-bar__select \.aims-select[\s\S]*?min-width:\s*12rem/,
  );
  assert.match(
    css,
    /\.filter-bar__select \.aims-select[\s\S]*?max-width:\s*14rem/,
  );
});

test("light theme muted text token meets charter contrast bump (apto#99)", () => {
  const lightBlock = css.match(
    /\[data-theme="light"\]\s*\{([\s\S]*?)\n\}/,
  );
  assert.ok(lightBlock, "expected light theme block");
  assert.match(lightBlock[1], /--aims-text-muted:\s*#64748b/);
});

test("dark theme muted + table links + chips + buttons (apto#107 charter §3–§5)", () => {
  const darkRoot = css.match(
    /:root,\s*\n\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/,
  );
  assert.ok(darkRoot, "expected dark theme root block");
  assert.match(darkRoot[1], /--aims-text-muted:\s*#b8c4d6/);

  assert.match(css, /\.data-table a\s*\{[^}]*color:\s*var\(--aims-link\)/);
  assert.doesNotMatch(
    css,
    /\.data-table a\s*\{[^}]*var\(--aims-accent\)/,
  );

  assert.match(css, /\.status-pill\s*\{[^}]*border:\s*1px solid var\(--aims-border\)/);
  assert.match(
    css,
    /\.status-pill\s*\{[^}]*background:\s*var\(--aims-surface-elevated\)/,
  );

  assert.match(css, /\.aims-btn\s*\{[^}]*width:\s*auto/);
  assert.match(css, /\.aims-btn\s*\{[^}]*flex:\s*0 0 auto/);
});
