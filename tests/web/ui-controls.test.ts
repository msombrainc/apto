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
  assert.match(lightBlock[1], /--aims-text-muted:\s*#5c6578/);
});
