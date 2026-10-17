import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Account, Asset, AssetInventoryRow } from "../../api";
import { AssetChangeLogTable } from "../../AssetChangeLogTable";
import { AccountAvatar } from "./AccountAvatar";
import { AimsButton } from "./Button";
import { DataTable } from "./DataTable";
import { EmptyState } from "./EmptyState";
import { FacilityPills } from "./FacilityPills";
import { FilterBar } from "./FilterBar";
import { IconBox, IconClock, IconPart, IconRefresh, IconUsers } from "./icons";
import { isCreatedTodayUtc } from "../../inventoryDates";
import {
  exportInventoryCsv,
  loadSavedInventorySearches,
  persistSavedInventorySearches,
  type SavedInventorySearch,
} from "../../inventorySavedSearches";
import { jobPath } from "../../routing/paths";
import { newId } from "../../id";
import { StatCard } from "./StatCard";

export const INVENTORY_COLUMN_IDS = [
  "apto",
  "serial",
  "part",
  "category",
  "grade",
  "status",
  "location",
  "account",
  "facility",
  "job",
  "created",
] as const;

type InventoryDashboardProps = {
  accounts: Account[];
  facilities: string[];
  inventoryQuery: string;
  onInventoryQueryChange: (v: string) => void;
  inventoryAccountId: string;
  onInventoryAccountIdChange: (v: string) => void;
  inventoryFacility: string;
  onInventoryFacilityChange: (v: string) => void;
  inventoryGrade: string;
  onInventoryGradeChange: (v: string) => void;
  inventoryStatus: string;
  onInventoryStatusChange: (v: string) => void;
  inventoryCategory: string;
  onInventoryCategoryChange: (v: string) => void;
  createdFrom: string;
  onCreatedFromChange: (v: string) => void;
  createdTo: string;
  onCreatedToChange: (v: string) => void;
  pasteCodes: string;
  onPasteCodesChange: (v: string) => void;
  inventoryPage: number;
  onInventoryPageChange: (v: number) => void;
  inventoryPageSize: number;
  onInventoryPageSizeChange: (v: number) => void;
  inventoryTotal: number;
  notFoundCodes: string[];
  visibleColumns: string[];
  onVisibleColumnsChange: (cols: string[]) => void;
  inventoryRows: AssetInventoryRow[];
  loading: boolean;
  onRefresh: () => void;
  onApplySavedSearch: (search: SavedInventorySearch) => void;
  selectedAsset: Asset | null;
  onSelectAsset: (id: string) => void;
};

export function InventoryDashboard({
  accounts,
  facilities,
  inventoryQuery,
  onInventoryQueryChange,
  inventoryAccountId,
  onInventoryAccountIdChange,
  inventoryFacility,
  onInventoryFacilityChange,
  inventoryGrade,
  onInventoryGradeChange,
  inventoryStatus,
  onInventoryStatusChange,
  inventoryCategory,
  onInventoryCategoryChange,
  createdFrom,
  onCreatedFromChange,
  createdTo,
  onCreatedToChange,
  pasteCodes,
  onPasteCodesChange,
  inventoryPage,
  onInventoryPageChange,
  inventoryPageSize,
  onInventoryPageSizeChange,
  inventoryTotal,
  notFoundCodes,
  visibleColumns,
  onVisibleColumnsChange,
  inventoryRows,
  loading,
  onRefresh,
  onApplySavedSearch,
  selectedAsset,
  onSelectAsset,
}: InventoryDashboardProps) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedInventorySearch[]>(() =>
    loadSavedInventorySearches(),
  );

  const createdToday = inventoryRows.filter((r) => isCreatedTodayUtc(r.createdAtUtc)).length;
  const pageCount = Math.max(1, Math.ceil(inventoryTotal / inventoryPageSize));

  const allColumns = useMemo(
    () => [
      {
        id: "apto",
        header: "Apto ID",
        cell: (r: AssetInventoryRow) => <span className="mono">{r.aptoId}</span>,
      },
      {
        id: "serial",
        header: "Serial",
        cell: (r: AssetInventoryRow) => r.serialNumber ?? "—",
      },
      {
        id: "part",
        header: "Part #",
        cell: (r: AssetInventoryRow) => (
          <span className="part-cell">
            <IconPart />
            <span>{r.partNumber ?? "—"}</span>
          </span>
        ),
      },
      {
        id: "category",
        header: "Category",
        cell: (r: AssetInventoryRow) => r.categoryName ?? "—",
      },
      {
        id: "grade",
        header: "Grade",
        cell: (r: AssetInventoryRow) => r.grade ?? "—",
      },
      {
        id: "status",
        header: "Status",
        cell: (r: AssetInventoryRow) => r.status ?? "—",
      },
      {
        id: "location",
        header: "Location",
        cell: (r: AssetInventoryRow) => r.locationName ?? "—",
      },
      {
        id: "account",
        header: "Account",
        cell: (r: AssetInventoryRow) => (
          <span className="account-cell">
            <AccountAvatar name={r.accountName} size="sm" />
            <span>{r.accountName}</span>
          </span>
        ),
      },
      {
        id: "facility",
        header: "Facility",
        cell: (r: AssetInventoryRow) => (
          <span className="facility-cell muted">@ {r.facilityCode ?? "—"}</span>
        ),
      },
      {
        id: "job",
        header: "Job",
        cell: (r: AssetInventoryRow) => (
          <Link to={jobPath(r.jobId)} className="text-link" onClick={(e) => e.stopPropagation()}>
            {r.jobId.slice(0, 8)}…
          </Link>
        ),
      },
      {
        id: "created",
        header: "Created",
        cell: (r: AssetInventoryRow) => new Date(r.createdAtUtc).toLocaleString(),
      },
    ],
    [],
  );

  const columns = allColumns.filter((c) => visibleColumns.includes(c.id));

  function saveCurrentSearch() {
    const name = window.prompt("Name this search");
    if (!name?.trim()) return;
    const entry: SavedInventorySearch = {
      id: newId(),
      name: name.trim(),
      params: {
        q: inventoryQuery,
        accountId: inventoryAccountId || undefined,
        facilityCode: inventoryFacility || undefined,
        grade: inventoryGrade || undefined,
        status: inventoryStatus || undefined,
        category: inventoryCategory || undefined,
        createdFrom: createdFrom || undefined,
        createdTo: createdTo || undefined,
        codes: pasteCodes.trim() || undefined,
        pageSize: inventoryPageSize,
        sortBy: "created",
        sortDir: "desc",
      },
      visibleColumns,
    };
    const next = [...savedSearches, entry];
    setSavedSearches(next);
    persistSavedInventorySearches(next);
  }

  function applySavedSearch(id: string) {
    const s = savedSearches.find((x) => x.id === id);
    if (!s) return;
    onApplySavedSearch(s);
  }

  return (
    <div className="dashboard-stack">
      <div className="dashboard-actions dashboard-actions--end">
        <AimsButton variant="secondary" onClick={() => exportInventoryCsv(inventoryRows)}>
          Export page CSV
        </AimsButton>
        <AimsButton variant="secondary" onClick={saveCurrentSearch}>
          Save search
        </AimsButton>
        {savedSearches.length > 0 && (
          <label className="inventory-account-select">
            Saved
            <select className="aims-select"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) applySavedSearch(e.target.value);
                e.target.value = "";
              }}
            >
              <option value="">Load…</option>
              {savedSearches.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
        )}
        <AimsButton variant="secondary" icon={<IconRefresh />} onClick={onRefresh}>
          Refresh
        </AimsButton>
      </div>

      <div className="kpi-row kpi-row--3" role="region" aria-label="Inventory summary">
        <StatCard label="On page" value={inventoryRows.length} icon={<IconBox />} />
        <StatCard label="Created today (page)" value={createdToday} icon={<IconClock />} />
        <StatCard label="Total matching" value={inventoryTotal} icon={<IconUsers />} />
      </div>

      <section className="dashboard-panel">
        <div className="inventory-filters-row">
          <FilterBar
            searchPlaceholder="Search Apto ID, serial, or part #"
            searchValue={inventoryQuery}
            onSearchChange={onInventoryQueryChange}
            countLabel={`${inventoryTotal} asset${inventoryTotal === 1 ? "" : "s"} total · page ${inventoryPage} of ${pageCount}`}
            searchId="inventory-filter"
          />
          <label className="inventory-account-select" htmlFor="inventory-account-filter">
            Account
            <select className="aims-select"
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

        <div className="inventory-filters-row">
          <label className="inventory-account-select">
            Grade
            <input value={inventoryGrade} onChange={(e) => onInventoryGradeChange(e.target.value)} />
          </label>
          <label className="inventory-account-select">
            Status
            <input value={inventoryStatus} onChange={(e) => onInventoryStatusChange(e.target.value)} />
          </label>
          <label className="inventory-account-select">
            Category
            <input value={inventoryCategory} onChange={(e) => onInventoryCategoryChange(e.target.value)} />
          </label>
          <label className="inventory-account-select">
            Created from
            <input type="date" value={createdFrom} onChange={(e) => onCreatedFromChange(e.target.value)} />
          </label>
          <label className="inventory-account-select">
            Created to
            <input type="date" value={createdTo} onChange={(e) => onCreatedToChange(e.target.value)} />
          </label>
        </div>

        <div className="inventory-paste-panel">
          <button
            type="button"
            className="aims-btn aims-btn--ghost"
            aria-expanded={pasteOpen}
            onClick={() => setPasteOpen((o) => !o)}
          >
            Paste Apto IDs / serials
          </button>
          {pasteOpen && (
            <div className="inventory-paste-body">
              <textarea
                aria-label="Paste list of Apto IDs or serials"
                rows={4}
                value={pasteCodes}
                onChange={(e) => onPasteCodesChange(e.target.value)}
                placeholder="One code per line"
              />
              {notFoundCodes.length > 0 && (
                <p className="muted" role="status">
                  Not found: {notFoundCodes.join(", ")}
                </p>
              )}
            </div>
          )}
        </div>

        <fieldset className="inventory-column-chooser">
          <legend>Columns</legend>
          {INVENTORY_COLUMN_IDS.map((id) => (
            <label key={id}>
              <input
                type="checkbox"
                checked={visibleColumns.includes(id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onVisibleColumnsChange([...visibleColumns, id]);
                  } else {
                    const next = visibleColumns.filter((c) => c !== id);
                    if (next.length === 0) return;
                    onVisibleColumnsChange(next);
                  }
                }}
              />
              {id}
            </label>
          ))}
        </fieldset>

        <DataTable
          ariaLabel="Cross-job inventory"
          loading={loading}
          rows={inventoryRows}
          rowKey={(r) => r.id}
          selectedKey={selectedAsset?.id ?? null}
          onRowClick={(r) => onSelectAsset(r.id)}
          columns={columns}
          emptyState={
            <EmptyState title="No matching assets" message="Try adjusting search or filters." />
          }
        />

        <div className="inventory-paging" role="navigation" aria-label="Inventory paging">
          <AimsButton
            variant="secondary"
            disabled={inventoryPage <= 1 || loading}
            onClick={() => onInventoryPageChange(inventoryPage - 1)}
          >
            Previous
          </AimsButton>
          <span className="muted">
            Page {inventoryPage} / {pageCount}
          </span>
          <AimsButton
            variant="secondary"
            disabled={inventoryPage >= pageCount || loading}
            onClick={() => onInventoryPageChange(inventoryPage + 1)}
          >
            Next
          </AimsButton>
          <label className="inventory-account-select">
            Page size
            <select className="aims-select"
              value={inventoryPageSize}
              onChange={(e) => {
                onInventoryPageSizeChange(Number(e.target.value));
                onInventoryPageChange(1);
              }}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>
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
