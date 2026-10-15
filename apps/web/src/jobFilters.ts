import type { Job } from "./api";

export type JobFilterState = {
  search: string;
  accountId: string;
  facilityCode: string;
};

export function filterJobs(jobs: Job[], filters: JobFilterState): Job[] {
  const q = filters.search.trim().toLowerCase();
  return jobs.filter((j) => {
    if (filters.accountId && j.accountId !== filters.accountId) return false;
    if (filters.facilityCode && (j.facilityCode ?? "") !== filters.facilityCode) {
      return false;
    }
    if (!q) return true;
    const hay = `${j.accountName} ${j.opsStatus ?? ""} ${j.facilityCode ?? ""} ${j.id}`.toLowerCase();
    return hay.includes(q);
  });
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
