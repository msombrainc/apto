import type { Job } from "./api";

export function jobTotalAssetCount(job: Job): number {
  return job.wipAssetCount + job.exceptionAssetCount + job.finishedAssetCount;
}

export function needsAddAssetConfirm(opsStatus: string | null | undefined): boolean {
  if (!opsStatus) return false;
  const n = opsStatus.trim().toLowerCase();
  return n === "in transit" || n === "in-transit" || n === "ops complete" || n === "ops-complete";
}

export function formatSlaDaysRemaining(daysRemaining: number): string {
  if (daysRemaining < 0) return `${Math.abs(daysRemaining)}d overdue`;
  if (daysRemaining === 0) return "Due today";
  return `${daysRemaining}d left`;
}
