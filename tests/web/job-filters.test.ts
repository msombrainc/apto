import test from "node:test";
import assert from "node:assert/strict";
import { filterJobs, isOpenJob, sortJobs } from "../../apps/web/src/jobFilters.ts";
import { buildJobsCsv, escapeCsv } from "../../apps/web/src/jobsListExport.ts";
import type { Job } from "../../apps/web/src/api.ts";
import { emptyJobFilters, jobFixture } from "./job-test-fixtures.ts";

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
  assert.equal(isOpenJob({ ...baseJob, opsStatus: "IN-TRANSIT" }), false);
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

test("sortJobs orders by dueDateUtc", () => {
  const jobs = [
    jobFixture({ id: "late", dueDateUtc: "2026-12-01T00:00:00Z" }),
    jobFixture({ id: "early", dueDateUtc: "2026-01-01T00:00:00Z" }),
  ];
  const sorted = sortJobs(jobs, "dueDateUtc", "asc");
  assert.equal(sorted[0].id, "early");
});

test("sortJobs orders by slaStatus", () => {
  const jobs = [
    jobFixture({ id: "over", slaStatus: "overdue" }),
    jobFixture({ id: "ok", slaStatus: "on-track" }),
  ];
  const sorted = sortJobs(jobs, "slaStatus", "asc");
  assert.equal(sorted[0].id, "ok");
});

test("escapeCsv quotes commas", () => {
  assert.equal(escapeCsv("a,b"), '"a,b"');
});

test("buildJobsCsv includes header and values", () => {
  const csv = buildJobsCsv([baseJob], ["account", "progressPercent"]);
  assert.match(csv, /^account,progressPercent/);
  assert.match(csv, /Acme,0/);
});

test("filterJobs opsStatus and slaFlag", () => {
  const jobs = [
    jobFixture({ id: "j1", opsStatus: "WIP", slaStatus: "on-track" }),
    jobFixture({ id: "j2", opsStatus: "Completed", slaStatus: "overdue" }),
  ];
  const byOps = filterJobs(jobs, { ...emptyJobFilters, opsStatus: "WIP" });
  assert.deepEqual(byOps.map((j) => j.id), ["j1"]);
  const bySla = filterJobs(jobs, { ...emptyJobFilters, slaFlag: "overdue" });
  assert.deepEqual(bySla.map((j) => j.id), ["j2"]);
});

test("filterJobs created date range boundaries", () => {
  const jobs = [
    jobFixture({ id: "before", createdAtUtc: "2026-10-01T12:00:00Z" }),
    jobFixture({ id: "on-from", createdAtUtc: "2026-10-05T00:00:00Z" }),
    jobFixture({ id: "on-to", createdAtUtc: "2026-10-10T23:59:59Z" }),
    jobFixture({ id: "after", createdAtUtc: "2026-10-11T00:00:00Z" }),
  ];
  const filtered = filterJobs(jobs, {
    ...emptyJobFilters,
    createdFrom: "2026-10-05",
    createdTo: "2026-10-10",
  });
  assert.deepEqual(filtered.map((j) => j.id), ["on-from", "on-to"]);
});

test("filterJobs start and due date ranges", () => {
  const jobs = [
    jobFixture({
      id: "start-in",
      startDateUtc: "2026-09-15T00:00:00Z",
      dueDateUtc: "2026-09-20T00:00:00Z",
    }),
    jobFixture({
      id: "start-out",
      startDateUtc: "2026-08-01T00:00:00Z",
      dueDateUtc: "2026-09-25T00:00:00Z",
    }),
    jobFixture({
      id: "due-out",
      startDateUtc: "2026-09-01T00:00:00Z",
      dueDateUtc: "2026-10-01T00:00:00Z",
    }),
  ];
  const filtered = filterJobs(jobs, {
    ...emptyJobFilters,
    startFrom: "2026-09-01",
    startTo: "2026-09-30",
    dueFrom: "2026-09-10",
    dueTo: "2026-09-30",
  });
  assert.deepEqual(filtered.map((j) => j.id), ["start-in"]);
});

test("filterJobs excludes jobs with null dates when range is set", () => {
  const jobs = [
    jobFixture({ id: "no-due", dueDateUtc: null }),
    jobFixture({ id: "has-due", dueDateUtc: "2026-10-05T00:00:00Z" }),
  ];
  const filtered = filterJobs(jobs, {
    ...emptyJobFilters,
    dueFrom: "2026-10-01",
    dueTo: "2026-10-31",
  });
  assert.deepEqual(filtered.map((j) => j.id), ["has-due"]);
});
