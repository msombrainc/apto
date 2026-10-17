import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const loginPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../apps/web/src/LoginPage.tsx",
);

test("login page has no Prototype · test data only footnote (apto#123)", () => {
  const src = readFileSync(loginPath, "utf8");
  assert.doesNotMatch(src, /Prototype\s*·\s*test data only/);
  assert.doesNotMatch(src, /login-footnote/);
});
