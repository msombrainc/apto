import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const appShellPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../apps/web/src/AppShell.tsx",
);
const source = readFileSync(appShellPath, "utf8");

test("AppShell clamps document scroll while mounted (apto#107 / #112)", () => {
  assert.match(source, /useEffect\(\(\)\s*=>\s*\{/);
  assert.match(source, /document\.documentElement/);
  assert.match(source, /html\.scrollTop\s*=\s*0/);
  assert.match(source, /body\.scrollTop\s*=\s*0/);
  assert.match(source, /addEventListener\(\s*["']scroll["']/);
  assert.match(source, /removeEventListener\(\s*["']scroll["']/);
});
