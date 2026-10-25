import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

test("sidebar brand uses preview amber SVG (apto#147)", () => {
  const brand = read("apps/web/src/BrandMark.tsx");
  assert.match(brand, /variant === "sidebar"/);
  assert.match(brand, /--aims-brand-amber/);
  const shell = read("apps/web/src/AppShell.tsx");
  assert.match(shell, /BrandMark variant="sidebar"/);
});

test("light muted text meets AA charter token (apto#147)", () => {
  const css = read("apps/web/src/styles.css");
  assert.match(css, /\[data-theme="light"\][\s\S]*--aims-text-muted: #5a6578/);
});

test("accounts list lede below actions (apto#147)", () => {
  const dash = read("apps/web/src/components/aims/AccountsDashboard.tsx");
  assert.match(dash, /accounts-page-lede/);
  assert.match(dash, /pageLede/);
  const app = read("apps/web/src/App.tsx");
  assert.match(app, /pageLede=\{accountsListLede\}/);
});
