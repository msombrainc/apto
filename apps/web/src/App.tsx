import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  Account,
  Asset,
  Job,
  PartNumber,
  createAccount,
  createJob,
  createJobAsset,
  getAsset,
  listAccounts,
  listFacilities,
  listJobAssets,
  listJobs,
  searchPartNumbers,
  updateAsset,
} from "./api";
import { DEMO_PASSWORD, DEMO_USER, isDemoLogin } from "./demoAuth";

type View = "accounts" | "jobs";

function slaRowClass(status: Job["slaStatus"]): string {
  if (status === "overdue") return "sla-overdue";
  if (status === "at-risk") return "sla-at-risk";
  return "sla-on-track";
}

export function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [view, setView] = useState<View>("accounts");
  const [query, setQuery] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [facilities, setFacilities] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    slaReceivingDays: 2,
    slaProcessingDays: 5,
    slaShippingDays: 3,
  });
  const [jobForm, setJobForm] = useState({
    accountId: "",
    facilityCode: "GA",
    opsStatus: "",
    startDateUtc: new Date().toISOString().slice(0, 10),
  });
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobAssets, setJobAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [partSearch, setPartSearch] = useState("");
  const [partOptions, setPartOptions] = useState<PartNumber[]>([]);
  const [assetForm, setAssetForm] = useState({
    partNumberId: "",
    newPartNumber: "",
    serialNumber: "",
  });
  const [assetEditSerial, setAssetEditSerial] = useState("");

  const refreshAccounts = useCallback(async () => {
    setError(null);
    try {
      setAccounts(await listAccounts(query));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load accounts");
    }
  }, [query]);

  const refreshJobs = useCallback(async () => {
    setError(null);
    try {
      setJobs(await listJobs());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load jobs");
    }
  }, []);

  const refreshJobAssets = useCallback(async (jobId: string) => {
    setError(null);
    try {
      setJobAssets(await listJobAssets(jobId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load assets");
    }
  }, []);

  const loadAssetDetail = useCallback(async (assetId: string) => {
    setError(null);
    try {
      const asset = await getAsset(assetId);
      setSelectedAsset(asset);
      setAssetEditSerial(asset.serialNumber ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load asset");
    }
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    void refreshAccounts();
    if (view === "accounts") return;
    void refreshJobs();
  }, [loggedIn, view, refreshAccounts, refreshJobs]);

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
    } else {
      setError("Invalid demo credentials (use demo / demo).");
    }
  }

  async function onCreateAccount(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createAccount(form);
      setForm({ name: "", code: "", slaReceivingDays: 2, slaProcessingDays: 5, slaShippingDays: 3 });
      await refreshAccounts();
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
      await refreshJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create job failed");
    }
  }

  async function onSearchParts() {
    setError(null);
    try {
      setPartOptions(await searchPartNumbers(partSearch));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Part search failed");
    }
  }

  async function onCreateAsset(e: FormEvent) {
    e.preventDefault();
    if (!selectedJobId) return;
    setError(null);
    try {
      await createJobAsset(selectedJobId, {
        partNumberId: assetForm.partNumberId || null,
        newPartNumber: assetForm.newPartNumber || null,
        serialNumber: assetForm.serialNumber || null,
      });
      setAssetForm({ partNumberId: "", newPartNumber: "", serialNumber: "" });
      await refreshJobAssets(selectedJobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create asset failed");
    }
  }

  async function onSaveAssetEdit(e: FormEvent) {
    e.preventDefault();
    if (!selectedAsset) return;
    setError(null);
    try {
      const updated = await updateAsset(selectedAsset.id, {
        serialNumber: assetEditSerial,
      });
      setSelectedAsset(updated);
      if (selectedJobId) await refreshJobAssets(selectedJobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update asset failed");
    }
  }

  function selectJob(job: Job) {
    setSelectedJobId(job.id);
    setSelectedAsset(null);
    void refreshJobAssets(job.id);
  }

  if (!loggedIn) {
    return (
      <main className="page">
        <h1>Apto — Demo login</h1>
        <p className="muted">Week-1 stub: single hardcoded user (see README).</p>
        <form className="card" onSubmit={onLogin}>
          <label>
            User
            <input name="user" defaultValue={DEMO_USER} />
          </label>
          <label>
            Password
            <input name="password" type="password" defaultValue={DEMO_PASSWORD} />
          </label>
          <button type="submit">Sign in</button>
        </form>
        {error && <p className="error">{error}</p>}
      </main>
    );
  }

  return (
    <main className="page">
      <header className="header">
        <h1>{view === "accounts" ? "Customer accounts" : "Jobs & SLA"}</h1>
        <div className="row header-actions">
          <button
            type="button"
            className={view === "accounts" ? "" : "link"}
            onClick={() => setView("accounts")}
          >
            Accounts
          </button>
          <button
            type="button"
            className={view === "jobs" ? "" : "link"}
            onClick={() => setView("jobs")}
          >
            Jobs
          </button>
          <button type="button" className="link" onClick={() => setLoggedIn(false)}>
            Sign out
          </button>
        </div>
      </header>

      {view === "accounts" && (
        <>
          <section className="card">
            <h2>Create account</h2>
            <form className="grid" onSubmit={onCreateAccount}>
              <label>
                Name
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label>
                Code
                <input
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </label>
              <label>
                SLA receiving (days)
                <input
                  type="number"
                  min={0}
                  value={form.slaReceivingDays}
                  onChange={(e) =>
                    setForm({ ...form, slaReceivingDays: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                SLA processing (days)
                <input
                  type="number"
                  min={0}
                  value={form.slaProcessingDays}
                  onChange={(e) =>
                    setForm({ ...form, slaProcessingDays: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                SLA shipping (days)
                <input
                  type="number"
                  min={0}
                  value={form.slaShippingDays}
                  onChange={(e) =>
                    setForm({ ...form, slaShippingDays: Number(e.target.value) })
                  }
                />
              </label>
              <button type="submit">Create</button>
            </form>
          </section>

          <section className="card">
            <h2>Search</h2>
            <div className="row">
              <input
                placeholder="Name or code"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="button" onClick={() => void refreshAccounts()}>Search</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>SLA (R/P/S)</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.code}</td>
                    <td>
                      {a.slaReceivingDays}/{a.slaProcessingDays}/{a.slaShippingDays}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {accounts.length === 0 && <p className="muted">No accounts yet.</p>}
          </section>
        </>
      )}

      {view === "jobs" && (
        <>
          <section className="card">
            <h2>Create job</h2>
            <form className="grid" onSubmit={onCreateJob}>
              <label>
                Account
                <select
                  required
                  value={jobForm.accountId}
                  onChange={(e) => setJobForm({ ...jobForm, accountId: e.target.value })}
                >
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.code})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Facility
                <select
                  value={jobForm.facilityCode}
                  onChange={(e) => setJobForm({ ...jobForm, facilityCode: e.target.value })}
                >
                  {facilities.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </label>
              <label>
                Ops status
                <input
                  value={jobForm.opsStatus}
                  onChange={(e) => setJobForm({ ...jobForm, opsStatus: e.target.value })}
                />
              </label>
              <label>
                Start date
                <input
                  type="date"
                  required
                  value={jobForm.startDateUtc}
                  onChange={(e) => setJobForm({ ...jobForm, startDateUtc: e.target.value })}
                />
              </label>
              <button type="submit" disabled={!jobForm.accountId}>Create job</button>
            </form>
            {accounts.length === 0 && (
              <p className="muted">Create an account first, then add jobs.</p>
            )}
          </section>

          <section className="card">
            <h2>Jobs list</h2>
            <button type="button" onClick={() => void refreshJobs()}>Refresh</button>
            <table aria-label="Jobs with SLA status">
              <thead>
                <tr>
                  <th scope="col">Account</th>
                  <th scope="col">Facility</th>
                  <th scope="col">Ops</th>
                  <th scope="col">Days left</th>
                  <th scope="col">SLA</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr
                    key={j.id}
                    className={`row-selectable ${slaRowClass(j.slaStatus)}${selectedJobId === j.id ? " row-selected" : ""}`}
                    tabIndex={0}
                    onClick={() => selectJob(j)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectJob(j);
                      }
                    }}
                    aria-selected={selectedJobId === j.id}
                  >
                    <td>{j.accountName}</td>
                    <td>{j.facilityCode ?? "—"}</td>
                    <td>{j.opsStatus ?? "—"}</td>
                    <td>
                      <span className="sr-only">Days remaining: </span>
                      {j.daysRemaining}
                    </td>
                    <td>
                      <span className={`sla-pill sla-pill--${j.slaStatus}`}>{j.slaStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {jobs.length === 0 && <p className="muted">No jobs yet.</p>}
          </section>

          {selectedJobId && (
            <section className="card assets-panel">
              <h2>Assets on job</h2>
              <p className="muted">Select a job row above, then add assets (FR-29, FR-35).</p>
              <form className="grid" onSubmit={onCreateAsset}>
                <label>
                  Search part number
                  <div className="row">
                    <input
                      value={partSearch}
                      onChange={(e) => setPartSearch(e.target.value)}
                      placeholder="Type to search"
                    />
                    <button type="button" onClick={() => void onSearchParts()}>Search</button>
                  </div>
                </label>
                <label>
                  Existing part
                  <select
                    value={assetForm.partNumberId}
                    onChange={(e) => setAssetForm({ ...assetForm, partNumberId: e.target.value })}
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
                    onChange={(e) => setAssetForm({ ...assetForm, newPartNumber: e.target.value })}
                    placeholder="When not in list"
                  />
                </label>
                <label>
                  Serial number
                  <input
                    value={assetForm.serialNumber}
                    onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                  />
                </label>
                <button type="submit">Add asset</button>
              </form>
              <table aria-label="Assets on selected job">
                <thead>
                  <tr>
                    <th>Part #</th>
                    <th>Serial</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {jobAssets.map((a) => (
                    <tr
                      key={a.id}
                      className={`row-selectable${selectedAsset?.id === a.id ? " row-selected" : ""}`}
                      tabIndex={0}
                      onClick={() => void loadAssetDetail(a.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          void loadAssetDetail(a.id);
                        }
                      }}
                      aria-selected={selectedAsset?.id === a.id}
                    >
                      <td>{a.partNumber ?? "—"}</td>
                      <td>{a.serialNumber ?? "—"}</td>
                      <td>{new Date(a.createdAtUtc).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {jobAssets.length === 0 && <p className="muted">No assets on this job yet.</p>}
            </section>
          )}

          {selectedAsset && (
            <section className="card">
              <h2>Edit asset</h2>
              <form className="grid" onSubmit={onSaveAssetEdit}>
                <label>
                  Part number
                  <input readOnly value={selectedAsset.partNumber ?? ""} />
                </label>
                <label>
                  Serial number
                  <input
                    value={assetEditSerial}
                    onChange={(e) => setAssetEditSerial(e.target.value)}
                  />
                </label>
                <button type="submit">Save changes</button>
              </form>
              <h3>Change log</h3>
              <table className="change-log-table" aria-label="Asset change log">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Old</th>
                    <th>New</th>
                    <th>User</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAsset.changeLog.map((e, i) => (
                    <tr key={`${e.fieldName}-${e.changedAtUtc}-${i}`}>
                      <td>{e.fieldName}</td>
                      <td>{e.oldValue ?? "—"}</td>
                      <td>{e.newValue ?? "—"}</td>
                      <td>{e.changedBy}</td>
                      <td>{new Date(e.changedAtUtc).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedAsset.changeLog.length === 0 && (
                <p className="muted">No changes logged yet.</p>
              )}
            </section>
          )}
        </>
      )}

      {error && <p className="error">{error}</p>}
    </main>
  );
}
