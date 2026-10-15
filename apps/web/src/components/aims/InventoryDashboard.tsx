import type { Account, Asset, AssetInventoryRow } from "../../api";
import { AssetChangeLogTable } from "../../AssetChangeLogTable";
import { AccountAvatar } from "./AccountAvatar";
import { AimsButton } from "./Button";
import { DataTable } from "./DataTable";
import { EmptyState } from "./EmptyState";
import { FacilityPills } from "./FacilityPills";
import { FilterBar } from "./FilterBar";
import { IconBox, IconClock, IconPart, IconRefresh, IconUsers } from "./icons";
import { StatCard } from "./StatCard";

type InventoryDashboardProps = {
  accounts: Account[];
  facilities: string[];
  inventoryQuery: string;
  onInventoryQueryChange: (v: string) => void;
  inventoryAccountId: string;
  onInventoryAccountIdChange: (v: string) => void;
  inventoryFacility: string;
  onInventoryFacilityChange: (v: string) => void;
  inventoryRows: AssetInventoryRow[];
  loading: boolean;
  onRefresh: () => void;
  selectedAsset: Asset | null;
  onSelectAsset: (id: string) => void;
};

function isCreatedTodayUtc(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate()
  );
}

export function InventoryDashboard({
  accounts,
  facilities,
  inventoryQuery,
  onInventoryQueryChange,
  inventoryAccountId,
  onInventoryAccountIdChange,
  inventoryFacility,
  onInventoryFacilityChange,
  inventoryRows,
  loading,
  onRefresh,
  selectedAsset,
  onSelectAsset,
}: InventoryDashboardProps) {
  const createdToday = inventoryRows.filter((r) => isCreatedTodayUtc(r.createdAtUtc)).length;
  const accountCount = new Set(inventoryRows.map((r) => r.accountName)).size;

  return (
    <div className="dashboard-stack">
      <div className="dashboard-actions dashboard-actions--end">
        <AimsButton variant="secondary" icon={<IconRefresh />} onClick={onRefresh}>
          Refresh
        </AimsButton>
      </div>

      <div className="kpi-row kpi-row--3" role="region" aria-label="Inventory summary">
        <StatCard label="Assets" value={inventoryRows.length} icon={<IconBox />} />
        <StatCard label="Created today" value={createdToday} icon={<IconClock />} />
        <StatCard label="Accounts" value={accountCount} icon={<IconUsers />} />
      </div>

      <section className="dashboard-panel">
        <div className="inventory-filters-row">
          <FilterBar
            searchPlaceholder="Search serial or part number"
            searchValue={inventoryQuery}
            onSearchChange={onInventoryQueryChange}
            countLabel={`${inventoryRows.length} asset${inventoryRows.length === 1 ? "" : "s"}`}
            searchId="inventory-filter"
          />
          <label className="inventory-account-select" htmlFor="inventory-account-filter">
            Account
            <select
              id="inventory-account-filter"
              value={inventoryAccountId}
              onChange={(e) => onInventoryAccountIdChange(e.target.value)}
            >
              <option value="">All accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>
          <FacilityPills
            facilities={facilities.length ? facilities : ["GA", "TX", "CA"]}
            value={inventoryFacility}
            onChange={onInventoryFacilityChange}
          />
        </div>

        <DataTable
          ariaLabel="Cross-job inventory"
          loading={loading}
          rows={inventoryRows}
          rowKey={(r) => r.id}
          selectedKey={selectedAsset?.id ?? null}
          onRowClick={(r) => onSelectAsset(r.id)}
          columns={[
            {
              id: "part",
              header: "Part #",
              cell: (r) => (
                <span className="part-cell">
                  <IconPart />
                  <span>{r.partNumber ?? "—"}</span>
                </span>
              ),
            },
            {
              id: "serial",
              header: "Serial",
              cell: (r) => r.serialNumber ?? "—",
            },
            {
              id: "account",
              header: "Account",
              cell: (r) => (
                <span className="account-cell">
                  <AccountAvatar name={r.accountName} size="sm" />
                  <span>{r.accountName}</span>
                </span>
              ),
            },
            {
              id: "facility",
              header: "Facility",
              cell: (r) => (
                <span className="facility-cell muted">
                  @ {r.facilityCode ?? "—"}
                </span>
              ),
            },
            {
              id: "job",
              header: "Job",
              cell: (r) => (
                <span className="job-link">{r.jobId.slice(0, 8)}…</span>
              ),
            },
            {
              id: "created",
              header: "Created",
              cell: (r) => new Date(r.createdAtUtc).toLocaleString(),
            },
          ]}
          emptyState={
            <EmptyState title="No matching assets" message="Try adjusting search or facility filters." />
          }
        />
      </section>

      {selectedAsset && (
        <section className="dashboard-panel" aria-labelledby="inventory-asset-detail-title">
          <h2 className="panel-title" id="inventory-asset-detail-title">Asset detail</h2>
          <p className="muted panel-lede">
            Job {selectedAsset.jobId.slice(0, 8)}… — change log (FR-37).
          </p>
          <h3 className="panel-subtitle">Change log</h3>
          <AssetChangeLogTable entries={selectedAsset.changeLog} />
        </section>
      )}
    </div>
  );
}
