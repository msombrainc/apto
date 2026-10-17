import type { Job } from "./api";
import type { JobsListColumnId } from "./jobsListColumns";

export function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function jobColumnCsvValue(job: Job, col: JobsListColumnId): string {
  switch (col) {
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
      return String(job.daysSinceStart);
    case "slaDaysRemaining":
      return String(job.daysRemaining);
    case "slaFlag":
      return job.slaStatus;
    case "wipAssets":
      return String(job.wipAssetCount);
    case "exceptionAssets":
      return String(job.exceptionAssetCount);
    case "finishedAssets":
      return String(job.finishedAssetCount);
    case "progressPercent":
      return String(job.progressPercent);
    default:
      return "";
  }
}

export function buildJobsCsv(jobs: Job[], columns: JobsListColumnId[]): string {
  const header = columns.join(",");
  const rows = jobs.map((job) =>
    columns.map((col) => escapeCsv(jobColumnCsvValue(job, col))).join(","),
  );
  return [header, ...rows].join("\n");
}

export function exportJobsCsv(jobs: Job[], columns: JobsListColumnId[]): void {
  const blob = new Blob([buildJobsCsv(jobs, columns)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `apto-jobs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
