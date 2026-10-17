import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Account, Job } from "../../api";
import {
  countJobsBySla,
  filterJobs,
  sortJobs,
  type JobFilterState,
  type JobsListSortKey,
} from "../../jobFilters";
import {
  DEFAULT_JOBS_LIST_COLUMNS,
  JOBS_LIST_COLUMN_LABELS,
  loadJobsListColumns,
  saveJobsListColumns,
  type JobsListColumnId,
} from "../../jobsListColumns";
import { exportJobsCsv } from "../../jobsListExport";
import { jobPath } from "../../routing/paths";
import { AimsButton } from "./Button";
import { DataTable } from "./DataTable";
import { FacilityPills } from "./FacilityPills";
import { IconPlus, IconRefresh } from "./icons";
import { Modal } from "./Modal";
import { StatCard } from "./StatCard";

type JobFormState = {
  accountId: string;
  facilityCode: string;
  opsStatus: string;
  startDateUtc: string;
};

type JobsListV2Props = {
  accounts: Account[];
  jobs: Job[];
  facilities: string[];
  loading: boolean;
  filters: JobFilterState;
  onFiltersChange: (f: JobFilterState) => void;
  slaRowClass: (status: Job["slaStatus"]) => string;
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  jobForm: JobFormState;
  onJobFormChange: (f: JobFormState) => void;
  onRefresh: () => void;
  onCreateJob: (e: FormEvent) => void;
};

export function JobsListV2({
  accounts,
  jobs,
  facilities,
  loading,
  filters,
  onFiltersChange,
  slaRowClass,
  createOpen,
  onCreateOpenChange,
  jobForm,
  onJobFormChange,
  onRefresh,
  onCreateJob,
}: JobsListV2Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const highlightJobId = (location.state as { highlightJobId?: string } | null)?.highlightJobId;

  const [columns, setColumns] = useState<JobsListColumnId[]>(() => loadJobsListColumns());
  const [sortKey, setSortKey] = useState<JobsListSortKey>("slaDaysRemaining");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);

  const filtered = useMemo(() => filterJobs(jobs, filters), [jobs, filters]);
  const sorted = useMemo(
    () => sortJobs(filtered, sortKey, sortDir),
    [filtered, sortKey, sortDir],
  );
  const { onTrack, atRisk, overdue } = countJobsBySla(filtered);

  const opsStatuses = useMemo(() => {
    const set = new Set<string>();
    for (const j of jobs) {
      if (j.opsStatus) set.add(j.opsStatus);
    }
    return [...set].sort();
  }, [jobs]);

  function toggleColumn(id: JobsListColumnId) {
    setColumns((prev) => {
      const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
      const ordered = DEFAULT_JOBS_LIST_COLUMNS.filter((c) => next.includes(c));
      saveJobsListColumns(ordered);
      return ordered;
    });
  }

  function onHeaderClick(key: JobsListSortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const tableColumns = columns.map((id) => ({
    id,
    header: (
      <button type="button" className="th-sort" onClick={() => onHeaderClick(id as JobsListSortKey)}>
        {JOBS_LIST_COLUMN_LABELS[id]}
        {sortKey === id ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
      </button>
    ),
    cell: (job: Job) => cellForColumn(job, id),
  }));

  return (
    <div className="dashboard-stack" data-testid="jobs-list-v2">
      <div className="dashboard-actions">
        <AimsButton variant="secondary" icon={<IconRefresh />} onClick={onRefresh}>
          Refresh
        </AimsButton>
        <AimsButton variant="secondary" onClick={() => setColumnPickerOpen(true)}>
          Columns
        </AimsButton>
        <AimsButton
          variant="secondary"
          onClick={() => exportJobsCsv(sorted, columns)}
          data-testid="jobs-export"
        >
          Export
        </AimsButton>
        <AimsButton
          variant="primary"
          icon={<IconPlus />}
          onClick={() => onCreateOpenChange(true)}
          disabled={accounts.length === 0}
        >
          New job
        </AimsButton>
      </div>

      <div className="filter-bar" data-testid="jobs-filters">
        <input
          type="search"
          placeholder="Search jobs…"
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          data-testid="jobs-search"
        />
        <select
          value={filters.accountId}
          onChange={(e) => onFiltersChange({ ...filters, accountId: e.target.value })}
          data-testid="jobs-filter-account"
        >
          <option value="">All accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <FacilityPills
          facilities={facilities}
          value={filters.facilityCode}
          onChange={(code) => onFiltersChange({ ...filters, facilityCode: code })}
        />
        <select
          value={filters.opsStatus}
          onChange={(e) => onFiltersChange({ ...filters, opsStatus: e.target.value })}
        >
          <option value="">All ops statuses</option>
          {opsStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={filters.slaFlag}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              slaFlag: e.target.value as JobFilterState["slaFlag"],
            })
          }
        >
          <option value="">All SLA flags</option>
          <option value="on-track">On track</option>
          <option value="at-risk">At risk</option>
          <option value="overdue">Overdue</option>
        </select>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filters.openOnly}
            onChange={(e) => onFiltersChange({ ...filters, openOnly: e.target.checked })}
            data-testid="jobs-open-only"
          />
          Open jobs only
        </label>
        <button
          type="button"
          className="link-button"
          onClick={() =>
            onFiltersChange({
              search: "",
              accountId: "",
              facilityCode: "",
              opsStatus: "",
              slaFlag: "",
              openOnly: true,
              createdFrom: "",
              createdTo: "",
              startFrom: "",
              startTo: "",
              dueFrom: "",
              dueTo: "",
            })
          }
        >
          Clear filters
        </button>
      </div>

      <div className="kpi-row kpi-row--4" role="region" aria-label="Jobs summary">
        <StatCard label="Matching" value={String(filtered.length)} />
        <StatCard label="On track" value={String(onTrack)} />
        <StatCard label="At risk" value={String(atRisk)} />
        <StatCard label="Overdue" value={String(overdue)} />
      </div>

      <DataTable
        ariaLabel="Jobs"
        tableTestId="jobs-table"
        columns={tableColumns}
        rows={sorted}
        rowKey={(j) => j.id}
        loading={loading}
        rowClassName={(j) =>
          `${slaRowClass(j.slaStatus)}${highlightJobId === j.id ? " jobs-row-highlight" : ""}`
        }
        onRowClick={(j) => navigate(jobPath(j.id))}
        emptyState={<p>No jobs match the current filters.</p>}
      />

      <Modal open={columnPickerOpen} title="Visible columns" onClose={() => setColumnPickerOpen(false)}>
        <ul className="column-picker-list">
          {DEFAULT_JOBS_LIST_COLUMNS.map((id) => (
            <li key={id}>
              <label>
                <input
                  type="checkbox"
                  checked={columns.includes(id)}
                  onChange={() => toggleColumn(id)}
                />
                {JOBS_LIST_COLUMN_LABELS[id]}
              </label>
            </li>
          ))}
        </ul>
      </Modal>

      <Modal open={createOpen} title="New job" onClose={() => onCreateOpenChange(false)}>
        <form className="form-stack" onSubmit={onCreateJob}>
          <label>
            Account
            <select
              required
              value={jobForm.accountId}
              onChange={(e) => onJobFormChange({ ...jobForm, accountId: e.target.value })}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Facility
            <select
              value={jobForm.facilityCode}
              onChange={(e) => onJobFormChange({ ...jobForm, facilityCode: e.target.value })}
            >
              {facilities.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ops status
            <input
              value={jobForm.opsStatus}
              onChange={(e) => onJobFormChange({ ...jobForm, opsStatus: e.target.value })}
            />
          </label>
          <label>
            Start date
            <input
              type="date"
              required
              value={jobForm.startDateUtc}
              onChange={(e) => onJobFormChange({ ...jobForm, startDateUtc: e.target.value })}
            />
          </label>
          <div className="form-actions">
            <AimsButton type="submit" variant="primary">Create</AimsButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function cellForColumn(job: Job, col: JobsListColumnId): ReactNode {
  switch (col) {
    case "jobId":
      return (
        <Link to={jobPath(job.id)} data-testid={`job-link-${job.id}`}>
          {job.id.slice(0, 8)}
        </Link>
      );
    case "account":
      return job.accountName;
    case "accountCode":
      return job.accountCode;
    case "facility":
      return job.facilityCode ?? "—";
    case "opsStatus":
      return job.opsStatus ?? "—";
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
      return `${job.progressPercent}%`;
    default:
      return "";
  }
}
