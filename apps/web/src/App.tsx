import { FormEvent, useCallback, useEffect, useState } from "react";
import { Account, createAccount, listAccounts } from "./api";

const DEMO_USER = "demo";
const DEMO_PASSWORD = "demo";

export function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [query, setQuery] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    slaReceivingDays: 2,
    slaProcessingDays: 5,
    slaShippingDays: 3,
  });

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setAccounts(await listAccounts(query));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load accounts");
    }
  }, [query]);

  useEffect(() => {
    if (loggedIn) void refresh();
  }, [loggedIn, refresh]);

  function onLogin(e: FormEvent) {
    e.preventDefault();
    const data = new FormData(e.currentTarget as HTMLFormElement);
    const user = String(data.get("user") ?? "");
    const pass = String(data.get("password") ?? "");
    if (user === DEMO_USER && pass === DEMO_PASSWORD) {
      setLoggedIn(true);
      setError(null);
    } else {
      setError("Invalid demo credentials (use demo / demo).");
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createAccount(form);
      setForm({ name: "", code: "", slaReceivingDays: 2, slaProcessingDays: 5, slaShippingDays: 3 });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
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
        <h1>Customer accounts</h1>
        <button type="button" className="link" onClick={() => setLoggedIn(false)}>
          Sign out
        </button>
      </header>

      <section className="card">
        <h2>Create account</h2>
        <form className="grid" onSubmit={onCreate}>
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
          <button type="button" onClick={() => void refresh()}>Search</button>
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

      {error && <p className="error">{error}</p>}
    </main>
  );
}
