import test from "node:test";
import assert from "node:assert/strict";
import { accountInitials } from "../../apps/web/src/components/aims/AccountAvatar.tsx";
import {
  formatSlaSummary,
  slaTotalDays,
} from "../../apps/web/src/components/aims/SlaSegmentBar.tsx";
import { debounceSchedule } from "../../apps/web/src/debounceSchedule.ts";
import { isCreatedTodayUtc } from "../../apps/web/src/inventoryDates.ts";
import { buildInventoryListParams } from "../../apps/web/src/inventoryListParams.ts";
import { filterJobs, countJobsBySla } from "../../apps/web/src/jobFilters.ts";
import type { Job } from "../../apps/web/src/api.ts";

test("accountInitials edge cases", () => {
  assert.equal(accountInitials(""), "?");
  assert.equal(accountInitials("   "), "?");
  assert.equal(accountInitials("Acme"), "AC");
  assert.equal(accountInitials("Acme Corp"), "AC");
});

test("slaTotalDays and formatSlaSummary", () => {
  assert.equal(slaTotalDays(2, 5, 3), 10);
  assert.equal(formatSlaSummary(0, 0, 0), "Not set");
  assert.equal(formatSlaSummary(2, 5, 3), "2d · 5d · 3d = 10d");
});

test("filterJobs applies account, facility, and search haystack", () => {
  const jobs: Job[] = [
    {
      id: "j1",
      accountId: "a1",
      accountName: "Acme",
      facilityCode: "GA",
      opsStatus: "open",
      slaStatus: "on-track",
      startDateUtc: "2026-01-01",
      dueDateUtc: null,
      slaTotalDays: 10,
      daysRemaining: 5,
      createdAtUtc: "2026-01-01T00:00:00Z",
    },
    {
      id: "j2",
      accountId: "a2",
      accountName: "Beta",
      facilityCode: "TX",
      opsStatus: "closed",
      slaStatus: "overdue",
      startDateUtc: "2026-01-01",
      dueDateUtc: null,
      slaTotalDays: 10,
      daysRemaining: -1,
      createdAtUtc: "2026-01-01T00:00:00Z",
    },
  ];
  assert.equal(
    filterJobs(jobs, { search: "", accountId: "a1", facilityCode: "" }).length,
    1,
  );
  assert.equal(
    filterJobs(jobs, { search: "tx", accountId: "", facilityCode: "TX" }).length,
    1,
  );
  assert.equal(
    filterJobs(jobs, { search: "j1", accountId: "", facilityCode: "" }).length,
    1,
  );
});

test("countJobsBySla uses same job set as KPI cards", () => {
  const jobs: Job[] = [
    {
      id: "1",
      accountId: "a",
      accountName: "A",
      facilityCode: "GA",
      opsStatus: "",
      slaStatus: "on-track",
      startDateUtc: "",
      dueDateUtc: null,
      slaTotalDays: 7,
      daysRemaining: 1,
      createdAtUtc: "2026-01-01T00:00:00Z",
    },
    {
      id: "2",
      accountId: "a",
      accountName: "A",
      facilityCode: "GA",
      opsStatus: "",
      slaStatus: "overdue",
      startDateUtc: "",
      dueDateUtc: null,
      slaTotalDays: 7,
      daysRemaining: -1,
      createdAtUtc: "2026-01-01T00:00:00Z",
    },
  ];
  const filtered = filterJobs(jobs, { search: "", accountId: "a", facilityCode: "GA" });
  const counts = countJobsBySla(filtered);
  assert.equal(counts.onTrack, 1);
  assert.equal(counts.overdue, 1);
});

test("countJobsBySla counts at-risk and ignores unknown slaStatus", () => {
  const jobs: Job[] = [
    {
      id: "a",
      accountId: "1",
      accountName: "A",
      facilityCode: "GA",
      opsStatus: "",
      slaStatus: "at-risk",
      startDateUtc: "",
      dueDateUtc: null,
      slaTotalDays: 5,
      daysRemaining: 1,
      createdAtUtc: "2026-01-01T00:00:00Z",
    },
    {
      id: "b",
      accountId: "1",
      accountName: "A",
      facilityCode: "GA",
      opsStatus: "",
      slaStatus: "on-track",
      startDateUtc: "",
      dueDateUtc: null,
      slaTotalDays: 5,
      daysRemaining: 3,
      createdAtUtc: "2026-01-01T00:00:00Z",
    },
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

test("buildInventoryListParams omits empty account and facility", () => {
  assert.deepEqual(buildInventoryListParams("widget", "", ""), { q: "widget" });
  assert.deepEqual(buildInventoryListParams("q", "acc-1", "GA"), {
    q: "q",
    accountId: "acc-1",
    facilityCode: "GA",
  });
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
