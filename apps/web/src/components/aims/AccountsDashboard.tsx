import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import type { Account, AccountWrite } from "../../api";
import { accountPath } from "../../routing/paths";
import { AccountAvatar } from "./AccountAvatar";
import { AimsButton } from "./Button";
import { CodePill } from "./CodePill";
import { DataTable } from "./DataTable";
import { EmptyState } from "./EmptyState";
import { FilterBar } from "./FilterBar";
import { IconClock, IconPlus, IconRefresh, IconUsers } from "./icons";
import { Modal } from "./Modal";
import { slaTotalDays } from "./SlaSegmentBar";
import { StatCard } from "./StatCard";

export type AccountStatusFilter = "Active" | "Inactive" | "Both";

type AccountsDashboardProps = {
  accounts: Account[];
  query: string;
  statusFilter: AccountStatusFilter;
  onStatusFilterChange: (status: AccountStatusFilter) => void;
  onQueryChange: (q: string) => void;
  loading: boolean;
  form: AccountWrite;
  onFormChange: (form: AccountWrite) => void;
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  onRefresh: () => void;
  onCreate: (e: FormEvent) => void;
};

function averageSlaDays(accounts: Account[]): number {
  if (accounts.length === 0) return 0;
  const sum = accounts.reduce(
    (acc, a) => acc + slaTotalDays(a.slaReceivingDays, a.slaProcessingDays, a.slaShippingDays),
    0,
  );
  return Math.round((sum / accounts.length) * 10) / 10;
}

function statusPillClass(status: string): string {
  return status === "Inactive"
    ? "status-pill status-pill--inactive"
    : "status-pill status-pill--active";
}

function accountsKpiSublabel(statusFilter: AccountStatusFilter): string {
  switch (statusFilter) {
    case "Inactive":
      return "Inactive customer records";
    case "Both":
      return "All customer records";
    default:
      return "Active customer records";
  }
}

export function AccountsDashboard({
  accounts,
  query,
  statusFilter,
  onStatusFilterChange,
  onQueryChange,
  loading,
  form,
  onFormChange,
  createOpen,
  onCreateOpenChange,
  onRefresh,
  onCreate,
}: AccountsDashboardProps) {
  const avg = averageSlaDays(accounts);

  return (
    <div className="dashboard-stack">
      <div className="dashboard-actions">
        <AimsButton variant="secondary" icon={<IconRefresh />} onClick={onRefresh}>
          Refresh
        </AimsButton>
        <AimsButton variant="primary" icon={<IconPlus />} onClick={() => onCreateOpenChange(true)}>
          New account
        </AimsButton>
      </div>

      <div className="kpi-row kpi-row--2" role="region" aria-label="Accounts summary">
        <StatCard
          label="Accounts"
          value={accounts.length}
          sublabel={accountsKpiSublabel(statusFilter)}
          icon={<IconUsers />}
        />
        <StatCard
          label="Average SLA"
          value={accounts.length === 0 ? "—" : `${avg}d`}
          sublabel="Input + settlement + sales"
          icon={<IconClock />}
        />
      </div>

      <section className="dashboard-panel">
        <FilterBar
          searchPlaceholder="Filter by name or code"
          searchValue={query}
          onSearchChange={onQueryChange}
          countLabel={`${accounts.length} account${accounts.length === 1 ? "" : "s"}`}
          searchId="accounts-filter"
        >
          <label className="filter-bar__select">
            Status
            <select className="aims-select"
              data-testid="f2-accounts-filter-status"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as AccountStatusFilter)}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Both">Both</option>
            </select>
          </label>
        </FilterBar>
        <DataTable
          ariaLabel="Customer accounts"
          loading={loading}
          rows={accounts}
          rowKey={(a) => a.id}
          columns={[
            {
              id: "account",
              header: "Account",
              cell: (a) => (
                <span className="account-cell">
                  <AccountAvatar name={a.name} size="sm" />
                  <Link
                    to={accountPath(a.id)}
                    data-testid={`f2-accounts-row-link-${a.id}`}
                  >
                    {a.name}
                  </Link>
                </span>
              ),
            },
            {
              id: "code",
              header: "Code",
              cell: (a) => <CodePill code={a.code} />,
            },
            {
              id: "status",
              header: "Status",
              cell: (a) => (
                <span className={statusPillClass(a.status)}>{a.status}</span>
              ),
            },
            {
              id: "apto",
              header: "Apto %",
              cell: (a) => (
                <span className="numeric-cell">
                  {Math.round(a.settings?.aptoPercentage ?? 0)}%
                </span>
              ),
            },
            {
              id: "inputSla",
              header: "Input SLA",
              cell: (a) => <span className="numeric-cell">{a.slaReceivingDays}</span>,
            },
            {
              id: "settlementSla",
              header: "Settlement SLA",
              cell: (a) => <span className="numeric-cell">{a.slaProcessingDays}</span>,
            },
            {
              id: "salesSla",
              header: "Sales SLA",
              cell: (a) => <span className="numeric-cell">{a.slaShippingDays}</span>,
            },
          ]}
          emptyState={
            <EmptyState title="No accounts yet" message="Create a customer account to get started." />
          }
        />
      </section>

      <Modal title="New account" open={createOpen} onClose={() => onCreateOpenChange(false)}>
        <form className="grid modal-form" onSubmit={onCreate}>
          <label>
            Name
            <input
              required
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Code
            <input
              required
              value={form.code}
              onChange={(e) => onFormChange({ ...form, code: e.target.value })}
            />
          </label>
          <label>
            Status
            <select className="aims-select"
              value={form.status ?? "Active"}
              onChange={(e) => onFormChange({ ...form, status: e.target.value })}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
          <label>
            Input SLA (days)
            <input
              type="number"
              min={0}
              value={form.slaReceivingDays}
              onChange={(e) =>
                onFormChange({ ...form, slaReceivingDays: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Settlement SLA (days)
            <input
              type="number"
              min={0}
              value={form.slaProcessingDays}
              onChange={(e) =>
                onFormChange({ ...form, slaProcessingDays: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Sales SLA (days)
            <input
              type="number"
              min={0}
              value={form.slaShippingDays}
              onChange={(e) =>
                onFormChange({ ...form, slaShippingDays: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Apto %
            <input
              type="number"
              min={0}
              max={100}
              value={form.settings?.aptoPercentage ?? 0}
              onChange={(e) =>
                onFormChange({
                  ...form,
                  settings: {
                    ...(form.settings ?? { aptoPercentage: 0 }),
                    aptoPercentage: Number(e.target.value),
                  },
                })
              }
            />
          </label>
          <div className="modal-form__actions">
            <AimsButton type="button" variant="ghost" onClick={() => onCreateOpenChange(false)}>
              Cancel
            </AimsButton>
            <AimsButton type="submit" variant="primary">Create account</AimsButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
