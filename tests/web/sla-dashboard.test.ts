import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregateAssetMix,
  breakdownByAccount,
  breakdownByFacility,
  slaDashboardScope,
  urgentJobsSorted,
} from "../../apps/web/src/slaDashboardAgg.ts";
import { jobFixture } from "./job-test-fixtures.ts";

test("urgentJobsSorted orders by daysRemaining ascending", () => {
  const jobs = [
    jobFixture({ id: "a", slaStatus: "at-risk", daysRemaining: 2 }),
    jobFixture({ id: "b", slaStatus: "overdue", daysRemaining: -3 }),
    jobFixture({ id: "c", slaStatus: "on-track", daysRemaining: 5 }),
    jobFixture({ id: "d", slaStatus: "overdue", daysRemaining: -1 }),
  ];
  const urgent = urgentJobsSorted(jobs);
  assert.deepEqual(urgent.map((j) => j.id), ["b", "d", "a"]);
});

test("breakdownByFacility groups SLA counts", () => {
  const jobs = [
    jobFixture({ id: "1", facilityCode: "GA", slaStatus: "on-track" }),
    jobFixture({ id: "2", facilityCode: "GA", slaStatus: "overdue", daysRemaining: -1 }),
    jobFixture({ id: "3", facilityCode: "TX", slaStatus: "at-risk", daysRemaining: 1 }),
  ];
  const rows = breakdownByFacility(jobs);
  const ga = rows.find((r) => r.key === "GA");
  assert.equal(ga?.onTrack, 1);
  assert.equal(ga?.overdue, 1);
  assert.equal(rows.find((r) => r.key === "TX")?.atRisk, 1);
});

test("aggregateAssetMix sums wip finished exception", () => {
  const jobs = [
    jobFixture({ id: "1", wipAssetCount: 2, finishedAssetCount: 1, exceptionAssetCount: 0 }),
    jobFixture({ id: "2", wipAssetCount: 1, finishedAssetCount: 0, exceptionAssetCount: 3 }),
  ];
  assert.deepEqual(aggregateAssetMix(jobs), { wip: 3, finished: 1, exception: 3 });
});

test("slaDashboardScope applies openOnly and filters", () => {
  const jobs = [
    jobFixture({
      id: "open",
      accountId: "acc-1",
      facilityCode: "GA",
      opsStatus: "open",
      slaStatus: "on-track",
    }),
    jobFixture({
      id: "closed",
      accountId: "acc-1",
      facilityCode: "GA",
      opsStatus: "Completed",
      slaStatus: "overdue",
      daysRemaining: -2,
    }),
    jobFixture({
      id: "other-acct",
      accountId: "acc-2",
      facilityCode: "TX",
      slaStatus: "at-risk",
      daysRemaining: 1,
    }),
  ];
  const scope = slaDashboardScope(jobs, { accountId: "acc-1", facilityCode: "" });
  assert.equal(scope.filtered.length, 1);
  assert.equal(scope.filtered[0].id, "open");
  assert.equal(scope.byAccount.length, 1);
});
