export type JobsListColumnId =
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

export const JOBS_LIST_COLUMN_LABELS: Record<JobsListColumnId, string> = {
  jobId: "Job ID",
  account: "Account",
  accountCode: "Account Code",
  facility: "Facility",
  opsStatus: "Ops status",
  daysSinceStart: "Days since start",
  dueDateUtc: "Deadline",
  slaDaysRemaining: "Days left",
  slaFlag: "SLA flag",
  slaStatus: "Status",
  wipAssets: "WIP assets",
  exceptionAssets: "Exceptions",
  finishedAssets: "Finished",
  progressPercent: "Progress %",
};

/** Design preview table density (apto#125). */
export const PREVIEW_JOBS_LIST_COLUMNS: JobsListColumnId[] = [
  "account",
  "facility",
  "opsStatus",
  "dueDateUtc",
  "slaDaysRemaining",
  "slaStatus",
];

export const DEFAULT_JOBS_LIST_COLUMNS: JobsListColumnId[] = [
  ...PREVIEW_JOBS_LIST_COLUMNS,
];

const STORAGE_KEY = "apto.jobsList.columns.v3";

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
