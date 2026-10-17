import type { Job } from "../../apps/web/src/api.ts";
import type { JobFilterState } from "../../apps/web/src/jobFilters.ts";

export const jobListExtras = {
  accountCode: "CODE",
  daysSinceStart: 0,
  wipAssetCount: 0,
  exceptionAssetCount: 0,
  finishedAssetCount: 0,
  progressPercent: 0,
};

export function jobFixture(partial: Partial<Job> & Pick<Job, "id">): Job {
  return {
    accountId: "a1",
    accountName: "Acme",
    facilityCode: "GA",
    opsStatus: "open",
    startDateUtc: "2026-01-01",
    dueDateUtc: null,
    slaTotalDays: 10,
    daysRemaining: 5,
    slaStatus: "on-track",
    createdAtUtc: "2026-01-01T00:00:00Z",
    ...jobListExtras,
    ...partial,
  };
}

export const emptyJobFilters: JobFilterState = {
  search: "",
  accountId: "",
  facilityCode: "",
  opsStatus: "",
  slaFlag: "",
  openOnly: false,
  createdFrom: "",
  createdTo: "",
  startFrom: "",
  startTo: "",
  dueFrom: "",
  dueTo: "",
};
