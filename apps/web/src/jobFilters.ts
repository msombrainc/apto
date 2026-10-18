import type { Job } from "./api";

export type JobFilterState = {
  search: string;
  accountId: string;
  facilityCode: string;
  opsStatus: string;
  slaFlag: "" | Job["slaStatus"];
  openOnly: boolean;
  createdFrom: string;
  createdTo: string;
  startFrom: string;
  startTo: string;
  dueFrom: string;
  dueTo: string;
};

const CLOSED_OPS = new Set(["completed", "canceled", "in transit", "in-transit"]);

function normalizeOpsStatus(ops: string): string {
  return ops.trim().toLowerCase().replace(/-/g, " ");
}

export function isOpenJob(job: Job): boolean {
  const ops = normalizeOpsStatus(job.opsStatus ?? "");
  if (!ops) return true;
  return !CLOSED_OPS.has(ops);
}

function inDateRange(iso: string | null, from: string, to: string): boolean {
  if (!from && !to) return true;
  if (!iso) return false;
  const d = iso.slice(0, 10);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

export function filterJobs(jobs: Job[], filters: JobFilterState): Job[] {
  const q = filters.search.trim().toLowerCase();
  return jobs.filter((j) => {
    if (filters.openOnly && !isOpenJob(j)) return false;
    if (filters.accountId && j.accountId !== filters.accountId) return false;
    if (filters.facilityCode && (j.facilityCode ?? "") !== filters.facilityCode) {
      return false;
    }
    if (filters.opsStatus && (j.opsStatus ?? "") !== filters.opsStatus) return false;
    if (filters.slaFlag && j.slaStatus !== filters.slaFlag) return false;
    if (!inDateRange(j.createdAtUtc, filters.createdFrom, filters.createdTo)) return false;
    if (!inDateRange(j.startDateUtc, filters.startFrom, filters.startTo)) return false;
    if (!inDateRange(j.dueDateUtc, filters.dueFrom, filters.dueTo)) return false;
    if (!q) return true;
    const hay = `${j.accountName} ${j.accountCode} ${j.opsStatus ?? ""} ${j.facilityCode ?? ""} ${j.id}`.toLowerCase();
    return hay.includes(q);
  });
}

export type JobsListSortKey =
  | "jobId"
  | "account"
  | "accountCode"
  | "facility"
  | "opsStatus"
  | "daysSinceStart"
  | "dueDateUtc"
  | "slaDaysRemaining"
  | "slaFlag"
  | "slaStatus"
  | "wipAssets"
  | "exceptionAssets"
  | "finishedAssets"
  | "progressPercent";

export function sortJobs(
  jobs: Job[],
  key: JobsListSortKey,
  direction: "asc" | "desc",
): Job[] {
  const mult = direction === "asc" ? 1 : -1;
  const sorted = [...jobs].sort((a, b) => {
    const av = jobSortValue(a, key);
    const bv = jobSortValue(b, key);
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * mult;
    return String(av).localeCompare(String(bv)) * mult;
  });
  return sorted;
}

function jobSortValue(job: Job, key: JobsListSortKey): string | number {
  switch (key) {
    case "jobId":
      return job.id;
    case "account":
      return job.accountName;
    case "accountCode":
      return job.accountCode;
    case "facility":
      return job.facilityCode ?? "";
    case "opsStatus":
      return job.opsStatus ?? "";
    case "daysSinceStart":
      return job.daysSinceStart;
    case "dueDateUtc":
      return job.dueDateUtc ?? "";
    case "slaDaysRemaining":
      return job.daysRemaining;
    case "slaFlag":
    case "slaStatus":
      return job.slaStatus;
    case "wipAssets":
      return job.wipAssetCount;
    case "exceptionAssets":
      return job.exceptionAssetCount;
    case "finishedAssets":
      return job.finishedAssetCount;
    case "progressPercent":
      return job.progressPercent;
    default:
      return "";
  }
}

export function countJobsBySla(jobs: Job[]): {
  onTrack: number;
  atRisk: number;
  overdue: number;
} {
  let onTrack = 0;
  let atRisk = 0;
  let overdue = 0;
  for (const j of jobs) {
    if (j.slaStatus === "on-track") onTrack++;
    else if (j.slaStatus === "at-risk") atRisk++;
    else if (j.slaStatus === "overdue") overdue++;
  }
  return { onTrack, atRisk, overdue };
}
