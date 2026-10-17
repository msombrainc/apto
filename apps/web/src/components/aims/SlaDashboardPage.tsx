import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Account, Job } from "../../api";
import { formatSlaDaysRemaining } from "../../jobDetailHelpers";
import { jobPath } from "../../routing/paths";
import { slaDashboardScope } from "../../slaDashboardAgg";
import { AimsButton } from "./Button";
import { DataTable } from "./DataTable";
import { FacilityPills } from "./FacilityPills";
import { IconRefresh } from "./icons";
import { StatCard } from "./StatCard";

type SlaDashboardPageProps = {
  accounts: Account[];
  jobs: Job[];
  facilities: string[];
  loading: boolean;
  onRefresh: () => void;
  slaRowClass: (status: Job["slaStatus"]) => string;
};

export function SlaDashboardPage({
  accounts,
  jobs,
  facilities,
  loading,
  onRefresh,
  slaRowClass,
}: SlaDashboardPageProps) {
  const [accountId, setAccountId] = useState("");
  const [facilityCode, setFacilityCode] = useState("");

  const scope = useMemo(
    () => slaDashboardScope(jobs, { accountId, facilityCode }),
    [jobs, accountId, facilityCode],
  );
  const { counts, byFacility, byAccount, assetMix, urgent, filtered } = scope;
  const assetTotal = assetMix.wip + assetMix.finished + assetMix.exception;

  return (
    <div className="dashboard-stack">
      <div className="dashboard-actions">
        <label className="field-inline">
          <span className="field-label">Account</span>
          <select
            className="aims-select"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            aria-label="Filter by account"
          >
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <FacilityPills
          facilities={facilities}
          value={facilityCode}
          onChange={setFacilityCode}
        />
        <AimsButton variant="secondary" icon={<IconRefresh />} onClick={onRefresh}>
          Refresh
        </AimsButton>
      </div>

      <div className="kpi-row kpi-row--4" role="region" aria-label="SLA summary">
        <StatCard label="On track" value={loading ? "…" : counts.onTrack} />
        <StatCard label="At risk" value={loading ? "…" : counts.atRisk} />
        <StatCard label="Overdue" value={loading ? "…" : counts.overdue} />
        <StatCard label="Open jobs" value={loading ? "…" : filtered.length} />
      </div>

      <div className="sla-dashboard-split">
        <section aria-labelledby="sla-by-facility">
          <h2 id="sla-by-facility" className="panel-title">By facility</h2>
          <DataTable
            ariaLabel="SLA counts by facility"
            loading={loading}
            emptyState={<p className="muted">No open jobs for this filter.</p>}
            columns={[
              { id: "facility", header: "Facility", cell: (r) => r.label },
              { id: "on", header: "On track", cell: (r) => String(r.onTrack) },
              { id: "risk", header: "At risk", cell: (r) => String(r.atRisk) },
              { id: "od", header: "Overdue", cell: (r) => String(r.overdue) },
            ]}
            rows={byFacility}
            rowKey={(r) => r.key}
          />
        </section>
        <section aria-labelledby="sla-by-account">
          <h2 id="sla-by-account" className="panel-title">By account</h2>
          <DataTable
            ariaLabel="SLA counts by account"
            loading={loading}
            emptyState={<p className="muted">No open jobs for this filter.</p>}
            columns={[
              { id: "account", header: "Account", cell: (r) => r.label },
              { id: "on", header: "On track", cell: (r) => String(r.onTrack) },
              { id: "risk", header: "At risk", cell: (r) => String(r.atRisk) },
              { id: "od", header: "Overdue", cell: (r) => String(r.overdue) },
            ]}
            rows={byAccount}
            rowKey={(r) => r.key}
          />
        </section>
      </div>

      <section aria-labelledby="sla-asset-mix">
        <h2 id="sla-asset-mix" className="panel-title">Asset mix (open jobs)</h2>
        {assetTotal === 0 ? (
          <p className="muted">No assets on open jobs in this scope.</p>
        ) : (
          <div className="sla-asset-mix-bar" role="img" aria-label="Asset status distribution">
            <div
              className="sla-asset-mix-seg sla-asset-mix-seg--wip"
              style={{ flexGrow: assetMix.wip }}
              title={`WIP: ${assetMix.wip}`}
            />
            <div
              className="sla-asset-mix-seg sla-asset-mix-seg--finished"
              style={{ flexGrow: assetMix.finished }}
              title={`Finished: ${assetMix.finished}`}
            />
            <div
              className="sla-asset-mix-seg sla-asset-mix-seg--exception"
              style={{ flexGrow: assetMix.exception }}
              title={`Exception: ${assetMix.exception}`}
            />
          </div>
        )}
        <ul className="sla-asset-mix-legend">
          <li>WIP: {assetMix.wip}</li>
          <li>Finished: {assetMix.finished}</li>
          <li>Exception: {assetMix.exception}</li>
        </ul>
      </section>

      <section aria-labelledby="sla-urgent">
        <h2 id="sla-urgent" className="panel-title">Needs attention</h2>
        <DataTable
          ariaLabel="At-risk and overdue jobs"
          loading={loading}
          emptyState={<p className="muted">No at-risk or overdue jobs in this scope.</p>}
          columns={[
            {
              id: "job",
              header: "Job",
              cell: (job) => (
                <Link to={jobPath(job.id)} className="table-link">
                  {job.id}
                </Link>
              ),
            },
            { id: "account", header: "Account", cell: (job) => job.accountName },
            { id: "facility", header: "Facility", cell: (job) => job.facilityCode },
            {
              id: "days",
              header: "Days left",
              cell: (job) => formatSlaDaysRemaining(job.daysRemaining),
            },
            {
              id: "sla",
              header: "SLA",
              cell: (job) => (
                <span className={`sla-pill sla-pill--${job.slaStatus}`}>
                  {job.slaStatus}
                </span>
              ),
            },
          ]}
          rows={urgent}
          rowKey={(job) => job.id}
          rowClassName={(job) => slaRowClass(job.slaStatus)}
        />
      </section>
    </div>
  );
}
