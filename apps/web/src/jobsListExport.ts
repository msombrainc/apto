import type { Job } from "./api";
import type { JobsListColumnId } from "./jobsListColumns";

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function exportJobsCsv(jobs: Job[], columns: JobsListColumnId[]): void {
  const header = columns.join(",");
  const rows = jobs.map((job) =>
    columns
      .map((col) => {
        switch (col) {
          case "jobId":
            return escapeCsv(job.id);
          case "account":
            return escapeCsv(job.accountName);
          case "accountCode":
            return escapeCsv(job.accountCode);
          case "facility":
            return escapeCsv(job.facilityCode ?? "");
          case "opsStatus":
            return escapeCsv(job.opsStatus ?? "");
          case "daysSinceStart":
            return String(job.daysSinceStart);
          case "slaDaysRemaining":
            return String(job.daysRemaining);
          case "slaFlag":
            return escapeCsv(job.slaStatus);
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
      })
      .join(","),
  );
  const blob = new Blob([[header, ...rows].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `apto-jobs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
