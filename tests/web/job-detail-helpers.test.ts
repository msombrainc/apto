import test from "node:test";
import assert from "node:assert/strict";
import {
  jobTotalAssetCount,
  needsAddAssetConfirm,
} from "../../apps/web/src/jobDetailHelpers.ts";
import type { Job } from "../../apps/web/src/api.ts";

const baseJob: Job = {
  id: "1",
  accountId: "a",
  accountName: "Acme",
  accountCode: "AC",
  facilityCode: "GA",
  opsStatus: "WIP",
  startDateUtc: "2026-01-01T00:00:00Z",
  dueDateUtc: "2026-01-10T00:00:00Z",
  slaTotalDays: 9,
  daysRemaining: 3,
  slaStatus: "on-track",
  createdAtUtc: "2026-01-01T00:00:00Z",
  daysSinceStart: 1,
  wipAssetCount: 2,
  exceptionAssetCount: 1,
  finishedAssetCount: 4,
  progressPercent: 57,
};

test("jobTotalAssetCount sums buckets", () => {
  assert.equal(jobTotalAssetCount(baseJob), 7);
});

test("needsAddAssetConfirm for In Transit and Ops Complete", () => {
  assert.equal(needsAddAssetConfirm("In Transit"), true);
  assert.equal(needsAddAssetConfirm("IN-TRANSIT"), true);
  assert.equal(needsAddAssetConfirm("Ops Complete"), true);
  assert.equal(needsAddAssetConfirm("WIP"), false);
  assert.equal(needsAddAssetConfirm(null), false);
});
