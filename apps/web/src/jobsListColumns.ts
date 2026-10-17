export type JobsListColumnId =
  | "jobId"
  | "account"
  | "accountCode"
  | "facility"
  | "opsStatus"
  | "daysSinceStart"
  | "slaDaysRemaining"
  | "slaFlag"
  | "wipAssets"
  | "exceptionAssets"
  | "finishedAssets"
  | "progressPercent";

export const JOBS_LIST_COLUMN_LABELS: Record<JobsListColumnId, string> = {
  jobId: "Job ID",
  account: "Account",
  accountCode: "Account Code",
  facility: "Facility",
  opsStatus: "Ops Status",
  daysSinceStart: "Days since start",
  slaDaysRemaining: "SLA days remaining",
  slaFlag: "SLA flag",
  wipAssets: "WIP assets",
  exceptionAssets: "Exceptions",
  finishedAssets: "Finished",
  progressPercent: "Progress %",
};

export const DEFAULT_JOBS_LIST_COLUMNS: JobsListColumnId[] = [
  "jobId",
  "account",
  "accountCode",
  "facility",
  "opsStatus",
  "daysSinceStart",
  "slaDaysRemaining",
  "slaFlag",
  "wipAssets",
  "exceptionAssets",
  "finishedAssets",
  "progressPercent",
];

const STORAGE_KEY = "apto.jobsList.columns.v1";

export function loadJobsListColumns(): JobsListColumnId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_JOBS_LIST_COLUMNS];
    const parsed = JSON.parse(raw) as JobsListColumnId[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_JOBS_LIST_COLUMNS];
    return parsed.filter((c) => c in JOBS_LIST_COLUMN_LABELS);
  } catch {
    return [...DEFAULT_JOBS_LIST_COLUMNS];
  }
}

export function saveJobsListColumns(columns: JobsListColumnId[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
}
