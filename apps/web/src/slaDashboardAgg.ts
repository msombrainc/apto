import type { Job } from "./api";
import { countJobsBySla, filterJobs, type JobFilterState } from "./jobFilters";

export type SlaBreakdownRow = {
  key: string;
  label: string;
  onTrack: number;
  atRisk: number;
  overdue: number;
};

export type AssetMixTotals = {
  wip: number;
  finished: number;
  exception: number;
};

function isUrgent(job: Job): boolean {
  return job.slaStatus === "at-risk" || job.slaStatus === "overdue";
}

export function aggregateAssetMix(jobs: Job[]): AssetMixTotals {
  let wip = 0;
  let finished = 0;
  let exception = 0;
  for (const j of jobs) {
    wip += j.wipAssetCount ?? 0;
    finished += j.finishedAssetCount ?? 0;
    exception += j.exceptionAssetCount ?? 0;
  }
  return { wip, finished, exception };
}

export function breakdownByFacility(jobs: Job[]): SlaBreakdownRow[] {
  const map = new Map<string, Job[]>();
  for (const j of jobs) {
    const key = j.facilityCode || "—";
    const list = map.get(key) ?? [];
    list.push(j);
    map.set(key, list);
  }
  return [...map.entries()]
    .map(([key, group]) => {
      const c = countJobsBySla(group);
      return { key, label: key, ...c };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function breakdownByAccount(jobs: Job[]): SlaBreakdownRow[] {
  const map = new Map<string, { label: string; jobs: Job[] }>();
  for (const j of jobs) {
    const key = j.accountId || "—";
    const label = j.accountName?.trim() || key;
    const entry = map.get(key) ?? { label, jobs: [] };
    entry.jobs.push(j);
    map.set(key, entry);
  }
  return [...map.entries()]
    .map(([key, { label, jobs: group }]) => {
      const c = countJobsBySla(group);
      return { key, label, ...c };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function urgentJobsSorted(jobs: Job[]): Job[] {
  return jobs
    .filter(isUrgent)
    .slice()
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function slaDashboardScope(
  jobs: Job[],
  filters: Pick<JobFilterState, "accountId" | "facilityCode">,
): {
  filtered: Job[];
  counts: ReturnType<typeof countJobsBySla>;
  byFacility: SlaBreakdownRow[];
  byAccount: SlaBreakdownRow[];
  assetMix: AssetMixTotals;
  urgent: Job[];
} {
  const filtered = filterJobs(jobs, {
    search: "",
    accountId: filters.accountId,
    facilityCode: filters.facilityCode,
    opsStatus: "",
    slaFlag: "",
    openOnly: true,
    createdFrom: "",
    createdTo: "",
    startFrom: "",
    startTo: "",
    dueFrom: "",
    dueTo: "",
  });
  return {
    filtered,
    counts: countJobsBySla(filtered),
    byFacility: breakdownByFacility(filtered),
    byAccount: breakdownByAccount(filtered),
    assetMix: aggregateAssetMix(filtered),
    urgent: urgentJobsSorted(filtered),
  };
}
