import test from "node:test";
import assert from "node:assert/strict";
import { filterJobs, isOpenJob, sortJobs } from "../../apps/web/src/jobFilters.ts";
import { buildJobsCsv, escapeCsv } from "../../apps/web/src/jobsListExport.ts";
import type { Job } from "../../apps/web/src/api.ts";

const baseJob: Job = {
  id: "j1",
  accountId: "a1",
  accountName: "Acme",
  accountCode: "ACME",
  facilityCode: "GA",
  opsStatus: "Open",
  startDateUtc: "2026-10-01T00:00:00Z",
  dueDateUtc: "2026-10-15T00:00:00Z",
  slaTotalDays: 10,
  daysRemaining: 5,
  slaStatus: "on-track",
  createdAtUtc: "2026-10-01T00:00:00Z",
  daysSinceStart: 5,
  wipAssetCount: 0,
  exceptionAssetCount: 0,
  finishedAssetCount: 0,
  progressPercent: 0,
};

test("isOpenJob excludes completed statuses", () => {
  assert.equal(isOpenJob(baseJob), true);
  assert.equal(isOpenJob({ ...baseJob, opsStatus: "Completed" }), false);
  assert.equal(isOpenJob({ ...baseJob, opsStatus: "in transit" }), false);
});

test("filterJobs openOnly default", () => {
  const jobs = [
    baseJob,
    { ...baseJob, id: "j2", opsStatus: "Completed" },
  ];
  const filtered = filterJobs(jobs, {
    search: "",
    accountId: "",
    facilityCode: "",
    opsStatus: "",
    slaFlag: "",
    openOnly: true,
    createdFrom: "",
    createdTo: "",
    startFrom: "",
    startTo: "",
    dueFrom: "",
    dueTo: "",
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "j1");
});

test("sortJobs orders by numeric column", () => {
  const jobs = [
    { ...baseJob, id: "a", progressPercent: 10 },
    { ...baseJob, id: "b", progressPercent: 90 },
  ];
  const sorted = sortJobs(jobs, "progressPercent", "desc");
  assert.equal(sorted[0].id, "b");
});

test("escapeCsv quotes commas", () => {
  assert.equal(escapeCsv("a,b"), '"a,b"');
});

test("buildJobsCsv includes header and values", () => {
  const csv = buildJobsCsv([baseJob], ["account", "progressPercent"]);
  assert.match(csv, /^account,progressPercent/);
  assert.match(csv, /Acme,0/);
});
