import { FormEvent, useCallback, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  Account,
  Asset,
  Job,
  createAccount,
  createJob,
  defaultAccountSettings,
  getAsset,
  listAccounts,
  listFacilities,
  listInventoryAssets,
  listJobs,
  AssetInventoryRow,
} from "./api";
import { AppShell } from "./AppShell";
import {
  isKnownAppPath,
  parseAccountId,
  parseInventoryAssetId,
  parseJobId,
  parseJobBulkUnserialized,
  parseJobSpreadsheetImport,
  viewFromPathname,
  type AppView,
} from "./routing/moduleMap";
import { ROUTES, inventoryAssetPath } from "./routing/paths";
import { LoginPage } from "./LoginPage";
import { isDemoLogin } from "./demoAuth";
import { buildInventoryListParams } from "./inventoryListParams";
import type { JobFilterState } from "./jobFilters";
import { useDebounced } from "./useDebounced";
import { AccountDetailPage } from "./components/aims/AccountDetailPage";
import { AccountsDashboard, type AccountStatusFilter } from "./components/aims/AccountsDashboard";
import { AlertBanner } from "./components/aims/AlertBanner";
import { InventoryDashboard } from "./components/aims/InventoryDashboard";
import { JobDetailPage } from "./components/aims/JobDetailPage";
import { BulkUnserializedPage } from "./components/aims/BulkUnserializedPage";
import { SpreadsheetImportPage } from "./components/aims/SpreadsheetImportPage";
import { JobsListV2 } from "./components/aims/JobsListV2";
import { ReferenceDataAdmin } from "./components/aims/ReferenceDataAdmin";
import { PartNumbersAdmin } from "./components/aims/PartNumbersAdmin";
import { QboSyncAdmin } from "./components/aims/QboSyncAdmin";
import { QuickScanPage } from "./components/aims/QuickScanPage";

function slaRowClass(status: Job["slaStatus"]): string {
  if (status === "overdue") return "sla-overdue";
  if (status === "at-risk") return "sla-at-risk";
  return "sla-on-track";
}

export function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);
  const view: AppView = viewFromPathname(location.pathname);
  const routeAssetId = parseInventoryAssetId(location.pathname);
  const routeAccountId = parseAccountId(location.pathname);
  const routeJobId = parseJobId(location.pathname);
  const spreadsheetImportJobId = parseJobSpreadsheetImport(location.pathname);
  const bulkUnserializedJobId = parseJobBulkUnserialized(location.pathname);
  const [query, setQuery] = useState("");
  const [accountStatusFilter, setAccountStatusFilter] = useState<AccountStatusFilter>("Active");
  const debouncedQuery = useDebounced(query, 300);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [facilities, setFacilities] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [accountCreateOpen, setAccountCreateOpen] = useState(false);
  const [jobCreateOpen, setJobCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    status: "Active",
    slaReceivingDays: 30,
    slaProcessingDays: 30,
    slaShippingDays: 60,
    settings: defaultAccountSettings(),
  });
  const [jobForm, setJobForm] = useState({
    accountId: "",
    facilityCode: "GA",
    opsStatus: "",
    startDateUtc: new Date().toISOString().slice(0, 10),
  });
  const [jobFilters, setJobFilters] = useState<JobFilterState>({
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
  });
  const [inventoryQuery, setInventoryQuery] = useState("");
  const debouncedInventoryQuery = useDebounced(inventoryQuery, 300);
  const [inventoryAccountId, setInventoryAccountId] = useState("");
  const [inventoryFacility, setInventoryFacility] = useState("");
  const [inventoryRows, setInventoryRows] = useState<AssetInventoryRow[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const refreshAccounts = useCallback(async (q: string, status: AccountStatusFilter) => {
    setError(null);
    setAccountsLoading(true);
    try {
      setAccounts(await listAccounts(q, status));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load accounts");
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  const refreshJobs = useCallback(async () => {
    setError(null);
    setJobsLoading(true);
    try {
      setJobs(await listJobs());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load jobs");
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const refreshInventory = useCallback(async () => {
    setError(null);
    setInventoryLoading(true);
    try {
      const rows = await listInventoryAssets(
        buildInventoryListParams(
          debouncedInventoryQuery,
          inventoryAccountId,
          inventoryFacility,
        ),
      );
      setInventoryRows(rows);
      setSelectedAsset((current) =>
        current && !rows.some((r) => r.id === current.id) ? null : current,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inventory");
    } finally {
      setInventoryLoading(false);
    }
  }, [debouncedInventoryQuery, inventoryAccountId, inventoryFacility]);

  const loadAssetDetail = useCallback(async (assetId: string) => {
    setError(null);
    try {
      const asset = await getAsset(assetId);
      setSelectedAsset(asset);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load asset");
    }
  }, []);

  useEffect(() => {
    if (!loggedIn || !routeAssetId) return;
    void loadAssetDetail(routeAssetId);
  }, [loggedIn, routeAssetId, loadAssetDetail]);

  useEffect(() => {
    if (!loggedIn) return;
    if (!routeAssetId) setSelectedAsset(null);
  }, [loggedIn, routeAssetId]);

  useEffect(() => {
    if (!loggedIn) return;
    if (view === "accounts" && !routeAccountId) {
      void refreshAccounts(debouncedQuery, accountStatusFilter);
      return;
    }
    if (view === "jobs") {
      void refreshAccounts("", "Both");
      void refreshJobs();
      return;
    }
    if (view === "inventory") {
      void refreshAccounts("", "Both");
      void listFacilities()
        .then(setFacilities)
        .catch(() => setFacilities(["GA", "TX", "CA"]));
    }
  }, [loggedIn, view, routeAccountId, debouncedQuery, accountStatusFilter, refreshAccounts, refreshJobs]);

  useEffect(() => {
    if (!loggedIn || view !== "inventory") return;
    void refreshInventory();
  }, [loggedIn, view, refreshInventory]);

  useEffect(() => {
    if (!loggedIn || view !== "jobs") return;
    void listFacilities()
      .then(setFacilities)
      .catch(() => setFacilities(["GA", "TX", "CA"]));
  }, [loggedIn, view]);

  useEffect(() => {
    if (accounts.length > 0 && !jobForm.accountId) {
      setJobForm((f) => ({ ...f, accountId: accounts[0].id }));
    }
  }, [accounts, jobForm.accountId]);

  function onLogin(e: FormEvent) {
    e.preventDefault();
    const data = new FormData(e.currentTarget as HTMLFormElement);
    const user = String(data.get("user") ?? "");
    const pass = String(data.get("password") ?? "");
    if (isDemoLogin(user, pass)) {
      setLoggedIn(true);
      setError(null);
      const path = location.pathname;
      if (path === "/" || path === "") {
        navigate(ROUTES.accounts, { replace: true });
      }
    } else {
      setError("Invalid demo credentials (use demo / demo).");
    }
  }

  async function onCreateAccount(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createAccount(form);
      setForm({
        name: "",
        code: "",
        status: "Active",
        slaReceivingDays: 30,
        slaProcessingDays: 30,
        slaShippingDays: 60,
        settings: defaultAccountSettings(),
      });
      setAccountCreateOpen(false);
      await refreshAccounts(debouncedQuery, accountStatusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function onCreateJob(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createJob({
        accountId: jobForm.accountId,
        facilityCode: jobForm.facilityCode,
        opsStatus: jobForm.opsStatus || undefined,
        startDateUtc: new Date(`${jobForm.startDateUtc}T12:00:00Z`).toISOString(),
      });
      setJobForm((f) => ({ ...f, opsStatus: "" }));
      setJobCreateOpen(false);
      await refreshJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create job failed");
    }
  }

  if (!loggedIn) {
    return <LoginPage error={error} onLogin={onLogin} />;
  }

  if (location.pathname === "/" || location.pathname === "") {
    return <Navigate to={ROUTES.accounts} replace />;
  }

  if (!isKnownAppPath(location.pathname)) {
    return <Navigate to={ROUTES.accounts} replace />;
  }

  const pageTitle =
    view === "accounts" && routeAccountId
      ? "Account detail"
      : view === "accounts"
      ? "Customer accounts"
      : view === "jobs" && spreadsheetImportJobId
        ? "Import spreadsheet"
      : view === "jobs" && routeJobId
        ? "Job detail"
      : view === "jobs"
        ? "Jobs"
        : view === "scan"
          ? "Warehouse scan"
          : view === "reference-data"
            ? "Reference data"
            : view === "part-numbers"
              ? "Part numbers"
              : view === "qbo-sync"
                ? "QuickBooks sync"
                : "Inventory browse";
  const pageSubtitle =
    view === "accounts" && routeAccountId
      ? "View and edit customer profile, fees, billing, and QuickBooks sync."
      : view === "accounts"
      ? "Every customer Apto collects equipment from, with the SLA they're promised."
      : view === "jobs" && spreadsheetImportJobId
        ? "Map columns, validate rows, and create serialized assets on this job."
      : view === "jobs"
        ? "Track facility jobs and SLA countdown from intake through shipping."
        : view === "scan"
          ? "Scan Apto IDs or serials to apply grade, status, and location presets with instant feedback."
          : view === "reference-data"
            ? "Maintain facilities, locations, statuses, grades, damages, and categories used across AIMS."
            : view === "part-numbers"
              ? "Search, add, and maintain part numbers and categories used on assets."
              : view === "qbo-sync"
                ? "Connection status, outbound queue, and retries for QuickBooks Online (sandbox)."
                : "Search assets across jobs with account and facility filters.";

  return (
    <AppShell
      view={view}
      onSignOut={() => {
        setLoggedIn(false);
        navigate("/", { replace: true });
      }}
      onGlobalLookupError={setError}
      title={pageTitle}
      subtitle={pageSubtitle}
    >
      {view === "accounts" && routeAccountId && (
        <AccountDetailPage accountId={routeAccountId} />
      )}

      {view === "accounts" && !routeAccountId && (
        <AccountsDashboard
          accounts={accounts}
          query={query}
          statusFilter={accountStatusFilter}
          onStatusFilterChange={setAccountStatusFilter}
          onQueryChange={setQuery}
          loading={accountsLoading}
          form={form}
          onFormChange={setForm}
          createOpen={accountCreateOpen}
          onCreateOpenChange={setAccountCreateOpen}
          onRefresh={() => void refreshAccounts(debouncedQuery, accountStatusFilter)}
          onCreate={onCreateAccount}
        />
      )}

      {view === "jobs" && spreadsheetImportJobId && (
        <SpreadsheetImportPage jobId={spreadsheetImportJobId} />
      )}
      {view === "jobs" && bulkUnserializedJobId && (
        <BulkUnserializedPage jobId={bulkUnserializedJobId} />
      )}
      {view === "jobs" && routeJobId && !spreadsheetImportJobId && !bulkUnserializedJobId && (
        <JobDetailPage jobId={routeJobId} accounts={accounts} />
      )}

      {view === "jobs" && !routeJobId && (
        <JobsListV2
          accounts={accounts}
          jobs={jobs}
          facilities={facilities}
          loading={jobsLoading}
          filters={jobFilters}
          onFiltersChange={setJobFilters}
          slaRowClass={slaRowClass}
          createOpen={jobCreateOpen}
          onCreateOpenChange={setJobCreateOpen}
          jobForm={jobForm}
          onJobFormChange={setJobForm}
          onRefresh={() => void refreshJobs()}
          onCreateJob={onCreateJob}
        />
      )}

      {view === "scan" && <QuickScanPage />}

      {view === "reference-data" && <ReferenceDataAdmin />}

      {view === "part-numbers" && <PartNumbersAdmin />}

      {view === "qbo-sync" && <QboSyncAdmin />}

      {view === "inventory" && (
        <InventoryDashboard
          accounts={accounts}
          facilities={facilities}
          inventoryQuery={inventoryQuery}
          onInventoryQueryChange={setInventoryQuery}
          inventoryAccountId={inventoryAccountId}
          onInventoryAccountIdChange={setInventoryAccountId}
          inventoryFacility={inventoryFacility}
          onInventoryFacilityChange={setInventoryFacility}
          inventoryRows={inventoryRows}
          loading={inventoryLoading}
          onRefresh={() => void refreshInventory()}
          selectedAsset={selectedAsset}
          onSelectAsset={(id) => {
            navigate(inventoryAssetPath(id));
            void loadAssetDetail(id);
          }}
        />
      )}

      {error && <AlertBanner message={error} />}
    </AppShell>
  );
}
