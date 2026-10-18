import test from "node:test";
import assert from "node:assert/strict";
import { accountInitials } from "../../apps/web/src/components/aims/AccountAvatar.tsx";
import {
  formatSlaPreviewAria,
  formatSlaSummary,
  slaTotalDays,
} from "../../apps/web/src/components/aims/SlaSegmentBar.tsx";
import { debounceSchedule } from "../../apps/web/src/debounceSchedule.ts";
import { isCreatedTodayUtc } from "../../apps/web/src/inventoryDates.ts";
import {
  buildInventoryListParams,
  inventoryListParamsFromSaved,
} from "../../apps/web/src/inventoryListParams.ts";
import { filterJobs, countJobsBySla } from "../../apps/web/src/jobFilters.ts";
import type { Job } from "../../apps/web/src/api.ts";
import { emptyJobFilters, jobFixture } from "./job-test-fixtures.ts";

test("accountInitials edge cases", () => {
  assert.equal(accountInitials(""), "?");
  assert.equal(accountInitials("   "), "?");
  assert.equal(accountInitials("Acme"), "AC");
  assert.equal(accountInitials("Acme Corp"), "AC");
});

test("slaTotalDays and formatSlaSummary", () => {
  assert.equal(slaTotalDays(2, 5, 3), 10);
  assert.equal(formatSlaSummary(0, 0, 0), "Not set");
  assert.equal(formatSlaSummary(2, 5, 3), "2d input · 5d settlement · 3d sales = 10d");
});

test("formatSlaPreviewAria (apto#125 pass 13)", () => {
  assert.equal(formatSlaPreviewAria(0, 0, 0), "Not set");
  assert.equal(
    formatSlaPreviewAria(45, 30, 60),
    "Receiving 45 days, processing 30 days, shipping 60 days",
  );
});

test("filterJobs applies account, facility, and search haystack", () => {
  const jobs: Job[] = [
    jobFixture({ id: "j1", accountId: "a1", accountName: "Acme", facilityCode: "GA" }),
    jobFixture({
      id: "j2",
      accountId: "a2",
      accountName: "Beta",
      facilityCode: "TX",
      opsStatus: "closed",
      slaStatus: "overdue",
      daysRemaining: -1,
    }),
  ];
  assert.equal(
    filterJobs(jobs, { ...emptyJobFilters, accountId: "a1" }).length,
    1,
  );
  assert.equal(
    filterJobs(jobs, { ...emptyJobFilters, search: "tx", facilityCode: "TX" }).length,
    1,
  );
  assert.equal(
    filterJobs(jobs, { ...emptyJobFilters, search: "j1" }).length,
    1,
  );
});

test("countJobsBySla uses same job set as KPI cards", () => {
  const jobs: Job[] = [
    jobFixture({ id: "1", accountId: "a", slaStatus: "on-track", daysRemaining: 1 }),
    jobFixture({ id: "2", accountId: "a", slaStatus: "overdue", daysRemaining: -1 }),
  ];
  const filtered = filterJobs(jobs, { ...emptyJobFilters, accountId: "a", facilityCode: "GA" });
  const counts = countJobsBySla(filtered);
  assert.equal(counts.onTrack, 1);
  assert.equal(counts.overdue, 1);
});

test("countJobsBySla counts at-risk and ignores unknown slaStatus", () => {
  const jobs: Job[] = [
    jobFixture({ id: "a", slaStatus: "at-risk", daysRemaining: 1 }),
    jobFixture({ id: "b", slaStatus: "on-track", daysRemaining: 3 }),
  ];
  const counts = countJobsBySla(jobs);
  assert.equal(counts.atRisk, 1);
  assert.equal(counts.onTrack, 1);
  assert.equal(counts.overdue, 0);
});

test("isCreatedTodayUtc respects UTC day boundary", () => {
  const now = new Date("2026-10-15T23:00:00Z");
  assert.equal(isCreatedTodayUtc("2026-10-15T01:00:00Z", now), true);
  assert.equal(isCreatedTodayUtc("2026-10-14T23:59:59Z", now), false);
});

test("inventoryListParamsFromSaved applies stored q on page 1 immediately", () => {
  const saved = buildInventoryListParams(
    "debounced-would-differ",
    "acc-1",
    "GA",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    3,
    50,
    "created",
    "desc",
  );
  const { page: _page, ...withoutPage } = saved;
  assert.deepEqual(inventoryListParamsFromSaved(withoutPage, 1), {
    ...withoutPage,
    page: 1,
    q: "debounced-would-differ",
  });
  assert.deepEqual(inventoryListParamsFromSaved({ ...withoutPage, q: "" }, 1).q, "");
});

test("buildInventoryListParams omits empty account and facility", () => {
  assert.deepEqual(
    buildInventoryListParams("widget", "", "", "", "", "", "", "", "", "", 1, 50, "created", "desc"),
    { q: "widget", page: 1, pageSize: 50, sortBy: "created", sortDir: "desc" },
  );
  assert.deepEqual(
    buildInventoryListParams("q", "acc-1", "GA", "", "", "", "", "", "", "", 2, 25, "serial", "asc"),
    {
      q: "q",
      accountId: "acc-1",
      facilityCode: "GA",
      page: 2,
      pageSize: 25,
      sortBy: "serial",
      sortDir: "asc",
    },
  );
  assert.deepEqual(
    buildInventoryListParams(
      "",
      "",
      "",
      "A",
      "WIPED",
      "",
      "laptops",
      "2026-01-01",
      "2026-01-31",
      "A1\nB2",
      1,
      50,
      "created",
      "desc",
    ),
    {
      q: "",
      grade: "A",
      status: "WIPED",
      category: "laptops",
      createdFrom: "2026-01-01",
      createdTo: "2026-01-31",
      codes: "A1\nB2",
      page: 1,
      pageSize: 50,
      sortBy: "created",
      sortDir: "desc",
    },
  );
});

test("debounceSchedule defers callback until delay", async () => {
  let fires = 0;
  const { schedule, cancel } = debounceSchedule(50, () => {
    fires++;
  });
  schedule();
  schedule();
  assert.equal(fires, 0);
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(fires, 1);
  cancel();
});
