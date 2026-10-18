import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  INVENTORY_PREVIEW_DEFAULT_COLUMNS,
} from "../../apps/web/src/inventoryListColumns.ts";
import {
  PREVIEW_JOBS_LIST_COLUMNS,
  JOBS_LIST_COLUMN_LABELS,
} from "../../apps/web/src/jobsListColumns.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

test("login light theme keeps dark hero (apto#125)", () => {
  const css = read("apps/web/src/styles.css");
  assert.match(css, /\[data-theme="light"\]\s*\.login-hero\s*\{[^}]*#0c1118/);
});

test("App page titles match preview charter (apto#125)", () => {
  const app = read("apps/web/src/App.tsx");
  assert.match(app, /view === "jobs"\s*\?\s*"Jobs & SLA"/);
  assert.match(app, /:\s*"Inventory"/);
  assert.doesNotMatch(app, /"Inventory browse"/);
});

test("inventory preview default columns are compact six (apto#125)", () => {
  assert.deepEqual(INVENTORY_PREVIEW_DEFAULT_COLUMNS, [
    "part",
    "serial",
    "account",
    "facility",
    "job",
    "created",
  ]);
  const app = read("apps/web/src/App.tsx");
  assert.match(app, /INVENTORY_PREVIEW_DEFAULT_COLUMNS/);
});

test("jobs preview default columns match charter headers (apto#125)", () => {
  assert.deepEqual(PREVIEW_JOBS_LIST_COLUMNS, [
    "account",
    "facility",
    "opsStatus",
    "dueDateUtc",
    "slaDaysRemaining",
    "slaStatus",
  ]);
  assert.equal(JOBS_LIST_COLUMN_LABELS.slaDaysRemaining, "Days left");
  assert.equal(JOBS_LIST_COLUMN_LABELS.dueDateUtc, "Deadline");
  assert.equal(JOBS_LIST_COLUMN_LABELS.slaStatus, "Status");
});

test("accounts table uses SLA segment bar not numeric SLA cols (apto#125)", () => {
  const accounts = read("apps/web/src/components/aims/AccountsDashboard.tsx");
  assert.match(accounts, /SlaSegmentBar/);
  assert.doesNotMatch(accounts, /header: "Input SLA"/);
  assert.doesNotMatch(accounts, /header: "Apto %"/);
});

test("AppShell can hide global asset lookup on list surfaces (apto#125)", () => {
  const shell = read("apps/web/src/AppShell.tsx");
  assert.match(shell, /showGlobalLookup/);
  const app = read("apps/web/src/App.tsx");
  assert.match(app, /hideGlobalLookup/);
  assert.match(app, /showGlobalLookup=\{!hideGlobalLookup\}/);
  const hideBlock = app.slice(app.indexOf("const hideGlobalLookup"), app.indexOf("showGlobalLookup"));
  assert.match(hideBlock, /view === "accounts"\s*\|\|\s*\n\s*view === "jobs"/);
  assert.doesNotMatch(hideBlock, /!routeAccountId/);
  assert.doesNotMatch(hideBlock, /!routeJobId/);
});

test("jobs KPI uses Matching when filters active (apto#125 pass 2)", () => {
  const jobs = read("apps/web/src/components/aims/JobsListV2.tsx");
  assert.match(jobs, /jobFiltersActive/);
  assert.match(jobs, /filtersActive \? "Matching" : "All jobs"/);
  const filters = read("apps/web/src/jobFilters.ts");
  assert.match(filters, /export function jobFiltersActive/);
});

test("admin table actions use tokenized link buttons (apto#125 pass 2)", () => {
  const css = read("apps/web/src/styles.css");
  assert.match(css, /\.btn-link\s*\{[^}]*var\(--aims-accent\)/);
});

test("job detail back nav matches Jobs & SLA title (apto#125 pass 2)", () => {
  const detail = read("apps/web/src/components/aims/JobDetailPage.tsx");
  assert.match(detail, /data-testid="f3-back-jobs"/);
  assert.match(detail, /Jobs &amp; SLA/);
});

test("accounts status filter under More filters disclosure (apto#125)", () => {
  const accounts = read("apps/web/src/components/aims/AccountsDashboard.tsx");
  assert.match(accounts, /moreFiltersOpen/);
  assert.match(accounts, /f2-accounts-filter-status/);
  assert.match(accounts, /More filters/);
});

test("jobs advanced filters gated behind disclosure (apto#125)", () => {
  const jobs = read("apps/web/src/components/aims/JobsListV2.tsx");
  assert.match(jobs, /advancedFiltersOpen/);
  assert.match(jobs, /data-testid="jobs-filters"/);
  assert.match(jobs, /data-testid="jobs-created-from"/);
  assert.match(jobs, /advancedFiltersOpen &&/);
});

test("jobs export and columns behind more filters (apto#125 pass 3)", () => {
  const jobs = read("apps/web/src/components/aims/JobsListV2.tsx");
  assert.match(jobs, /jobs-advanced-filters__tools/);
  assert.match(jobs, /data-testid="jobs-export"/);
  const dashStart = jobs.indexOf('<div className="dashboard-actions">');
  const dashEnd = jobs.indexOf("</div>", dashStart);
  const dashBlock = jobs.slice(dashStart, dashEnd);
  assert.doesNotMatch(dashBlock, /jobs-export/);
});

test("jobs default FilterBar is search + account only (apto#125 pass 3)", () => {
  const jobs = read("apps/web/src/components/aims/JobsListV2.tsx");
  const barStart = jobs.indexOf("<FilterBar");
  const barEnd = jobs.indexOf("</FilterBar>", barStart);
  const barBlock = jobs.slice(barStart, barEnd);
  assert.doesNotMatch(barBlock, /FacilityPills/);
  assert.doesNotMatch(barBlock, /All ops statuses/);
});

test("jobs SLA KPI cards toggle slaFlag filter (apto#125 pass 3)", () => {
  const jobs = read("apps/web/src/components/aims/JobsListV2.tsx");
  const stat = read("apps/web/src/components/aims/StatCard.tsx");
  assert.match(stat, /stat-card--active/);
  assert.match(jobs, /slaFlag: filters\.slaFlag === "at-risk" \? "" : "at-risk"/);
  assert.match(jobs, /filteredForSlaBands/);
  assert.match(jobs, /countJobsBySla\(filteredForSlaBands\)/);
});

test("accounts average SLA KPI uses whole days (apto#125 pass 3)", () => {
  const accounts = read("apps/web/src/components/aims/AccountsDashboard.tsx");
  assert.match(accounts, /Math\.round\(avg\)/);
  assert.match(accounts, /sublabel=\{accounts\.length === 0 \? undefined : "days"\}/);
});

test("accounts table SLA bar-only without summary line (apto#125 pass 4)", () => {
  const accounts = read("apps/web/src/components/aims/AccountsDashboard.tsx");
  assert.match(accounts, /variant="bar-only"/);
  const bar = read("apps/web/src/components/aims/SlaSegmentBar.tsx");
  assert.match(bar, /variant === "bar-only"/);
  assert.match(bar, /!barOnly && <span className="sla-summary"/);
});

test("account detail header shows SLA bar (apto#125 pass 4)", () => {
  const detail = read("apps/web/src/components/aims/AccountDetailPage.tsx");
  assert.match(detail, /data-testid="f2-account-header-sla"/);
  assert.match(detail, /SlaSegmentBar/);
  assert.match(detail, /from "\.\/accountStatusPill"/);
});

test("theme segment shows Dark and Light labels (apto#125 pass 4)", () => {
  const theme = read("apps/web/src/components/aims/ThemeSegment.tsx");
  assert.match(theme, /theme-segment-label/);
  assert.match(theme, /"Dark"/);
  assert.match(theme, /"Light"/);
  const login = read("apps/web/src/LoginPage.tsx");
  assert.match(login, /ThemeSegment/);
});

test("inventory secondary tools behind disclosure (apto#125 pass 3)", () => {
  const inv = read("apps/web/src/components/aims/InventoryDashboard.tsx");
  assert.match(inv, /data-testid="inventory-more-tools"/);
  assert.match(inv, /data-testid="inventory-tools-panel"/);
  assert.match(inv, /moreToolsOpen &&/);
});

test("pass 3 shared list chrome styles (apto#125)", () => {
  const css = read("apps/web/src/styles.css");
  assert.match(css, /\.accounts-open-chevron/);
  assert.match(css, /\.dashboard-panel:has\(\.data-table-wrap\) \.data-table td/);
});

test("bar-only unset SLA omits sla-summary class (apto#125 pass 5)", () => {
  const bar = read("apps/web/src/components/aims/SlaSegmentBar.tsx");
  assert.match(bar, /variant === "bar-only"/);
  assert.match(bar, /sla-empty/);
  const barOnlyUnset = bar.slice(
    bar.indexOf('if (variant === "bar-only")'),
    bar.indexOf("return <span className=\"sla-summary muted\">Not set</span>"),
  );
  assert.doesNotMatch(barOnlyUnset, /sla-summary/);
});

test("jobs SLA status pill uses shared helper (apto#125 pass 5)", () => {
  const jobs = read("apps/web/src/components/aims/JobsListV2.tsx");
  assert.match(jobs, /from "\.\/jobSlaPill"/);
  assert.match(jobs, /jobSlaPillClass/);
  const pill = read("apps/web/src/components/aims/jobSlaPill.ts");
  assert.match(pill, /export function jobSlaPillClass/);
});

test("QBO sync admin uses btn-link for record and QBO anchors (apto#125 pass 5)", () => {
  const qbo = read("apps/web/src/components/aims/QboSyncAdmin.tsx");
  assert.match(qbo, /className="btn-link"/);
  assert.match(qbo, /from "react-router-dom"/);
  assert.match(qbo, /<Link[\s\S]*btn-link/);
});

test("inventory KPI uses Matching when filters active (apto#125 pass 6)", () => {
  const inv = read("apps/web/src/components/aims/InventoryDashboard.tsx");
  assert.match(inv, /inventoryFiltersActive/);
  assert.match(inv, /filtersActive \? "Matching" : "Assets"/);
  const filters = read("apps/web/src/inventoryFilters.ts");
  assert.match(filters, /export function inventoryFiltersActive/);
});

test("admin list panels use FilterBar (apto#125 pass 6)", () => {
  const ref = read("apps/web/src/components/aims/ReferenceDataAdmin.tsx");
  assert.match(ref, /from "\.\/FilterBar"/);
  assert.match(ref, /searchId="ref-admin-search"/);
  const pn = read("apps/web/src/components/aims/PartNumbersAdmin.tsx");
  assert.match(pn, /from "\.\/FilterBar"/);
  assert.match(pn, /searchId="pn-admin-search"/);
});

test("login sign-in uses cream CTA in light theme (apto#125 pass 6)", () => {
  const login = read("apps/web/src/LoginPage.tsx");
  assert.match(login, /data-testid="login-sign-in"/);
  const css = read("apps/web/src/styles.css");
  assert.match(css, /\[data-theme="light"\]\s*\.login-panel\s*\.btn-primary/);
});

test("accounts list preview chrome pass 7 (apto#125)", () => {
  const app = read("apps/web/src/App.tsx");
  assert.match(app, /"Customer accounts"/);
  const accounts = read("apps/web/src/components/aims/AccountsDashboard.tsx");
  assert.match(accounts, /Filter by name or code/);
  assert.match(accounts, /SLA · receiving \/ processing \/ shipping/);
  assert.doesNotMatch(accounts, /header: "Status"/);
  const kpi = read("apps/web/src/accountsKpiLabels.ts");
  assert.match(kpi, /return "Accounts";/);
  assert.match(kpi, /return "Active customers";/);
  const stat = read("apps/web/src/components/aims/StatCard.tsx");
  assert.match(stat, /footnote\?:/);
  assert.match(accounts, /Receiving \+ processing \+ shipping/);
});

test("inventory advanced filters gated; facility pills match preview (apto#125)", () => {
  const inv = read("apps/web/src/components/aims/InventoryDashboard.tsx");
  assert.match(inv, /advancedOpen/);
  assert.match(inv, /More filters/);
  assert.match(inv, /FacilityPills/);
  assert.match(inv, /inventory-facility-filter/);
  assert.match(inv, /filtersActive \? "Matching" : "Assets"/);
  assert.match(inv, /label="Created today"/);
  assert.match(inv, /label="Accounts"/);
  assert.match(inv, /Across all facilities/);
  assert.match(inv, /Filter by serial or part number/);
});

test("inventory page subtitle matches preview (apto#125 pass 8)", () => {
  const app = read("apps/web/src/App.tsx");
  assert.match(app, /Every asset received, across all jobs and facilities/);
});

test("jobs ops column header matches preview (apto#125 pass 9)", () => {
  assert.equal(JOBS_LIST_COLUMN_LABELS.opsStatus, "Ops status");
});

test("jobs list preview chrome pass 9 (apto#125)", () => {
  const app = read("apps/web/src/App.tsx");
  assert.match(
    app,
    /Pickups in progress, newest first\. Use the cards to focus on at-risk or overdue jobs\./,
  );
  assert.match(
    app,
    /Every customer Apto collects equipment from, with the SLA they're promised\./,
  );
  const jobs = read("apps/web/src/components/aims/JobsListV2.tsx");
  assert.match(jobs, /Filter by job ID or account/);
  assert.match(jobs, /Open across facilities/);
  assert.match(jobs, /Filtered results/);
  assert.match(jobs, /sublabel="Within SLA window"/);
  assert.match(jobs, /sublabel="Running out of time"/);
  assert.match(jobs, /sublabel="SLA breached"/);
  assert.match(jobs, /testId="jobs-facility-filter"/);
  const barStart = jobs.indexOf("<FilterBar");
  const barEnd = jobs.indexOf("</FilterBar>", barStart);
  const barBlock = jobs.slice(barStart, barEnd);
  assert.doesNotMatch(barBlock, /FacilityPills/);
  const afterBar = jobs.slice(barEnd, barEnd + 400);
  assert.match(afterBar, /FacilityPills/);
});
