import type { FormEvent } from "react";
import type { Account, Asset, Job, PartNumber } from "../../api";
import { AssetChangeLogTable } from "../../AssetChangeLogTable";
import { AccountAvatar } from "./AccountAvatar";
import { AimsButton } from "./Button";
import { DataTable } from "./DataTable";
import { EmptyState } from "./EmptyState";
import { FacilityPills } from "./FacilityPills";
import { IconAlert, IconBriefcase, IconCheckCircle, IconClock, IconPlus, IconPin, IconRefresh } from "./icons";
import { Modal } from "./Modal";
import { countJobsBySla } from "../../jobFilters";
import { StatCard } from "./StatCard";

type JobFormState = {
  accountId: string;
  facilityCode: string;
  opsStatus: string;
  startDateUtc: string;
};

type JobsDashboardProps = {
  accounts: Account[];
  jobs: Job[];
  facilities: string[];
  loading: boolean;
  jobSearch: string;
  onJobSearchChange: (v: string) => void;
  jobAccountFilter: string;
  onJobAccountFilterChange: (v: string) => void;
  jobFacilityFilter: string;
  onJobFacilityFilterChange: (v: string) => void;
  filteredJobs: Job[];
  slaRowClass: (status: Job["slaStatus"]) => string;
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  jobForm: JobFormState;
  onJobFormChange: (f: JobFormState) => void;
  onRefresh: () => void;
  onCreateJob: (e: FormEvent) => void;
  selectedJobId: string | null;
  onSelectJob: (job: Job) => void;
  jobAssets: Asset[];
  partSearch: string;
  onPartSearchChange: (v: string) => void;
  onSearchParts: () => void;
  partOptions: PartNumber[];
  assetForm: { partNumberId: string; newPartNumber: string; serialNumber: string };
  onAssetFormChange: (f: { partNumberId: string; newPartNumber: string; serialNumber: string }) => void;
  onCreateAsset: (e: FormEvent) => void;
  selectedAsset: Asset | null;
  assetEditSerial: string;
  onAssetEditSerialChange: (v: string) => void;
  onSaveAssetEdit: (e: FormEvent) => void;
  onLoadAssetDetail: (id: string) => void;
};

function formatDeadline(job: Job): string {
  if (!job.dueDateUtc) return "—";
  return new Date(job.dueDateUtc).toLocaleDateString();
}

export function JobsDashboard({
  accounts,
  jobs,
  facilities,
  loading,
  jobSearch,
  onJobSearchChange,
  jobAccountFilter,
  onJobAccountFilterChange,
  jobFacilityFilter,
  onJobFacilityFilterChange,
  filteredJobs,
  slaRowClass,
  createOpen,
  onCreateOpenChange,
  jobForm,
  onJobFormChange,
  onRefresh,
  onCreateJob,
  selectedJobId,
  onSelectJob,
  jobAssets,
  partSearch,
  onPartSearchChange,
  onSearchParts,
  partOptions,
  assetForm,
  onAssetFormChange,
  onCreateAsset,
  selectedAsset,
  assetEditSerial,
  onAssetEditSerialChange,
  onSaveAssetEdit,
  onLoadAssetDetail,
}: JobsDashboardProps) {
  const { onTrack, atRisk, overdue } = countJobsBySla(filteredJobs);
  const filtersActive = Boolean(
    jobSearch.trim() || jobAccountFilter || jobFacilityFilter,
  );

  return (
    <div className="dashboard-stack">
      <div className="dashboard-actions">
        <AimsButton variant="secondary" icon={<IconRefresh />} onClick={onRefresh}>
          Refresh
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

      <div className="kpi-row kpi-row--4" role="region" aria-label="Jobs summary">
        <StatCard
          label={filtersActive ? "Matching" : "All jobs"}
          value={filteredJobs.length}
          icon={<IconBriefcase />}
        />
        <StatCard label="On track" value={onTrack} icon={<IconCheckCircle />} />
        <StatCard label="At risk" value={atRisk} icon={<IconAlert />} />
        <StatCard label="Overdue" value={overdue} icon={<IconClock />} />
      </div>

      <section className="dashboard-panel">
        <div className="jobs-filters">
          <label className="jobs-filters__search" htmlFor="jobs-filter-search">
            <span className="sr-only">Search jobs</span>
            <input
              id="jobs-filter-search"
              type="search"
              placeholder="Search by job or account"
              value={jobSearch}
              onChange={(e) => onJobSearchChange(e.target.value)}
            />
          </label>
          <label htmlFor="jobs-account-filter">
            Account
            <select className="aims-select"
              id="jobs-account-filter"
              value={jobAccountFilter}
              onChange={(e) => onJobAccountFilterChange(e.target.value)}
            >
              <option value="">All accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>
          <FacilityPills
            facilities={facilities.length ? facilities : ["GA", "TX", "CA"]}
            value={jobFacilityFilter}
            onChange={onJobFacilityFilterChange}
          />
        </div>

        <DataTable
          ariaLabel="Jobs with SLA status"
          loading={loading}
          rows={filteredJobs}
          rowKey={(j) => j.id}
          selectedKey={selectedJobId}
          onRowClick={onSelectJob}
          rowClassName={(j) => slaRowClass(j.slaStatus)}
          columns={[
            {
              id: "account",
              header: "Account",
              cell: (j) => (
                <span className="account-cell">
                  <AccountAvatar name={j.accountName} size="sm" />
                  <span>{j.accountName}</span>
                </span>
              ),
            },
            {
              id: "facility",
              header: "Facility",
              cell: (j) => (
                <span className="facility-cell">
                  <IconPin />
                  {j.facilityCode ?? "—"}
                </span>
              ),
            },
            {
              id: "ops",
              header: "Ops status",
              cell: (j) => j.opsStatus ?? "—",
            },
            {
              id: "deadline",
              header: "Deadline",
              cell: (j) => formatDeadline(j),
            },
            {
              id: "days",
              header: "Days left",
              cell: (j) => (
                <span className={j.slaStatus === "overdue" ? "days-left--overdue" : undefined}>
                  <span className="sr-only">Days remaining: </span>
                  {j.daysRemaining}
                </span>
              ),
            },
            {
              id: "sla",
              header: "SLA",
              cell: (j) => (
                <span className={`sla-pill sla-pill--${j.slaStatus}`}>
                  <span className="sr-only">SLA status: </span>
                  {j.slaStatus.replace(/-/g, " ")}
                </span>
              ),
            },
          ]}
          emptyState={<EmptyState title="No jobs yet" message="Add a job once you have customer accounts." />}
        />
      </section>

      {selectedJobId && (
        <section className="dashboard-panel assets-panel" aria-labelledby="jobs-assets-panel-title">
          <h2 className="panel-title" id="jobs-assets-panel-title">Assets on job</h2>
          <p className="muted panel-lede">Select a job row above, then add assets (FR-29, FR-35).</p>
          <form className="grid" onSubmit={onCreateAsset}>
            <label>
              Search part number
              <div className="row">
                <input
                  value={partSearch}
                  onChange={(e) => onPartSearchChange(e.target.value)}
                  placeholder="Type to search"
                />
                <AimsButton type="button" onClick={onSearchParts}>Search</AimsButton>
              </div>
            </label>
            <label>
              Existing part
              <select className="aims-select"
                value={assetForm.partNumberId}
                onChange={(e) => onAssetFormChange({ ...assetForm, partNumberId: e.target.value })}
              >
                <option value="">— or create new below —</option>
                {partOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.number}
                    {p.categoryName ? ` (${p.categoryName})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              New part number
              <input
                value={assetForm.newPartNumber}
                onChange={(e) => onAssetFormChange({ ...assetForm, newPartNumber: e.target.value })}
                placeholder="When not in list"
              />
            </label>
            <label>
              Serial number
              <input
                value={assetForm.serialNumber}
                onChange={(e) => onAssetFormChange({ ...assetForm, serialNumber: e.target.value })}
              />
            </label>
            <AimsButton type="submit" variant="primary">Add asset</AimsButton>
          </form>
          <table aria-label="Assets on selected job" className="data-table">
            <thead>
              <tr>
                <th scope="col">Apto ID</th>
                <th scope="col">Part #</th>
                <th scope="col">Serial</th>
                <th scope="col">Grade</th>
                <th scope="col">Status</th>
                <th scope="col">Created</th>
              </tr>
            </thead>
            <tbody>
              {jobAssets.map((a) => (
                <tr
                  key={a.id}
                  className={`row-selectable${selectedAsset?.id === a.id ? " row-selected" : ""}`}
                  tabIndex={0}
                  onClick={() => onLoadAssetDetail(a.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onLoadAssetDetail(a.id);
                    }
                  }}
                  aria-selected={selectedAsset?.id === a.id}
                >
                  <td>{a.aptoId ?? "—"}</td>
                  <td>{a.partNumber ?? "—"}</td>
                  <td>{a.serialNumber ?? "—"}</td>
                  <td>{a.grade ?? "—"}</td>
                  <td>{a.status ?? "—"}</td>
                  <td>{new Date(a.createdAtUtc).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobAssets.length === 0 && (
            <EmptyState title="No assets on this job" message="Add a part number and serial to register equipment." />
          )}
        </section>
      )}

      {selectedAsset && jobAssets.some((a) => a.id === selectedAsset.id) && (
        <section className="dashboard-panel" aria-labelledby="jobs-edit-asset-title">
          <h2 className="panel-title" id="jobs-edit-asset-title">Edit asset</h2>
          <form className="grid" onSubmit={onSaveAssetEdit}>
            <label>
              Part number
              <input readOnly value={selectedAsset.partNumber ?? ""} />
            </label>
            <label>
              Serial number
              <input value={assetEditSerial} onChange={(e) => onAssetEditSerialChange(e.target.value)} />
            </label>
            <AimsButton type="submit" variant="primary">Save changes</AimsButton>
          </form>
          <h3>Change log</h3>
          <AssetChangeLogTable entries={selectedAsset.changeLog} />
        </section>
      )}

      <Modal title="New job" open={createOpen} onClose={() => onCreateOpenChange(false)}>
        <form className="grid modal-form" onSubmit={onCreateJob}>
          <label>
            Account
            <select className="aims-select"
              required
              value={jobForm.accountId}
              onChange={(e) => onJobFormChange({ ...jobForm, accountId: e.target.value })}
            >
              <option value="">Select account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
              ))}
            </select>
          </label>
          <label>
            Facility
            <select className="aims-select"
              value={jobForm.facilityCode}
              onChange={(e) => onJobFormChange({ ...jobForm, facilityCode: e.target.value })}
            >
              {(facilities.length ? facilities : ["GA", "TX", "CA"]).map((f) => (
                <option key={f} value={f}>{f}</option>
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
          {accounts.length === 0 && (
            <p className="muted">Create an account first, then add jobs.</p>
          )}
          <div className="modal-form__actions">
            <AimsButton type="button" variant="ghost" onClick={() => onCreateOpenChange(false)}>
              Cancel
            </AimsButton>
            <AimsButton type="submit" variant="primary" disabled={!jobForm.accountId}>
              Create job
            </AimsButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
