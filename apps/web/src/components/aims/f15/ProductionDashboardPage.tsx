import { useMemo, useState } from "react";
import { DataTable } from "../DataTable";
import { FacilityPills } from "../FacilityPills";
import { PrototypeBanner } from "../PrototypeBanner";
import { StatCard } from "../StatCard";
import {
  F15_PRODUCTION_BY_FACILITY,
  type F15ProductionPeriod,
} from "../../../prototype/f15SampleData";

const PERIOD_LABELS: Record<F15ProductionPeriod, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

const PERIOD_SCALE: Record<F15ProductionPeriod, number> = {
  "7d": 0.28,
  "30d": 1,
  "90d": 2.85,
};

export function ProductionDashboardPage() {
  const facilities = Object.keys(F15_PRODUCTION_BY_FACILITY);
  const [facility, setFacility] = useState(facilities[0] ?? "GA");
  const [period, setPeriod] = useState<F15ProductionPeriod>("30d");

  const scope = F15_PRODUCTION_BY_FACILITY[facility];
  const scale = PERIOD_SCALE[period];

  const userRows = useMemo(
    () =>
      (scope?.users ?? []).map((u) => ({
        key: u.userName,
        userName: u.userName,
        units: Math.round(u.unitsProcessed * scale),
        topCategory: Object.entries(u.categories).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—",
      })),
    [scope, scale],
  );

  const categoryRows = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const u of scope?.users ?? []) {
      for (const [cat, count] of Object.entries(u.categories)) {
        totals[cat] = (totals[cat] ?? 0) + Math.round(count * scale);
      }
    }
    return Object.entries(totals)
      .map(([category, units]) => ({ key: category, category, units }))
      .sort((a, b) => b.units - a.units);
  }, [scope, scale]);

  const runRate = Math.round((scope?.runRatePerDay ?? 0) * (period === "7d" ? 1 : period === "90d" ? 0.95 : 1));
  const totalUnits = userRows.reduce((sum, r) => sum + r.units, 0);

  return (
    <div className="dashboard-stack" data-testid="f15-production-dashboard">
      <PrototypeBanner />

      <div className="dashboard-actions">
        <FacilityPills facilities={facilities} value={facility} onChange={setFacility} />
        <label className="field-inline">
          <span className="field-label">Period</span>
          <select
            className="aims-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value as F15ProductionPeriod)}
            data-testid="f15-production-period"
          >
            {(Object.keys(PERIOD_LABELS) as F15ProductionPeriod[]).map((p) => (
              <option key={p} value={p}>{PERIOD_LABELS[p]}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="kpi-row kpi-row--3" role="region" aria-label="Production summary">
        <StatCard label="Units processed" value={totalUnits} />
        <StatCard label="Run rate / day" value={runRate} />
        <StatCard label="Active operators" value={userRows.length} />
      </div>

      <div className="sla-dashboard-split">
        <section className="dashboard-panel" aria-labelledby="f15-by-user">
          <h2 id="f15-by-user" className="panel-title">Output by user</h2>
          <DataTable
            ariaLabel="Output by user"
            tableTestId="f15-production-by-user"
            rows={userRows}
            rowKey={(r) => r.key}
            columns={[
              { id: "user", header: "User", cell: (r) => r.userName },
              { id: "units", header: "Units", cell: (r) => String(r.units) },
              { id: "top", header: "Top category", cell: (r) => r.topCategory },
            ]}
          />
        </section>
        <section className="dashboard-panel" aria-labelledby="f15-by-category">
          <h2 id="f15-by-category" className="panel-title">Output by category</h2>
          <DataTable
            ariaLabel="Output by category"
            tableTestId="f15-production-by-category"
            rows={categoryRows}
            rowKey={(r) => r.key}
            columns={[
              { id: "cat", header: "Category", cell: (r) => r.category },
              { id: "units", header: "Units", cell: (r) => String(r.units) },
            ]}
          />
        </section>
      </div>
    </div>
  );
}
