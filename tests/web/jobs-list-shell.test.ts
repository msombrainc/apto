import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const jobsListPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../apps/web/src/components/aims/JobsListV2.tsx",
);
const source = readFileSync(jobsListPath, "utf8");

test("Jobs list wraps filters and table in dashboard-panel (apto#107 / #112)", () => {
  assert.match(source, /className="dashboard-panel"[^>]*aria-label="Jobs list"/);
  const panelStart = source.indexOf('aria-label="Jobs list"');
  assert.ok(panelStart > 0, "expected jobs dashboard-panel");
  const panelSection = source.slice(panelStart, source.indexOf("</section>", panelStart));
  assert.match(panelSection, /data-testid="jobs-filters"/);
  assert.match(panelSection, /<DataTable/);
});
