import type { ReactNode } from "react";
import { useTheme, type Theme } from "./theme";

export type AppView = "accounts" | "jobs" | "inventory";

type AppShellProps = {
  view: AppView;
  onViewChange: (view: AppView) => void;
  onSignOut: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

const VIEW_LABELS: Record<AppView, string> = {
  accounts: "Accounts",
  jobs: "Jobs & SLA",
  inventory: "Inventory",
};

export function AppShell({
  view,
  onViewChange,
  onSignOut,
  title,
  subtitle,
  children,
}: AppShellProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="aims-app">
      <aside className="aims-sidebar" aria-label="Main menu">
        <div className="sidebar-brand">
          <div className="brand-mark" aria-label="Apto Solutions">
            <span className="brand-dot" aria-hidden />
            <span className="brand-name">Apto</span>
            <span className="brand-suffix">Solutions</span>
          </div>
          <span className="sidebar-product">AIMS</span>
        </div>
        <nav className="sidebar-nav" aria-label="Operations">
          {(Object.keys(VIEW_LABELS) as AppView[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`sidebar-nav-btn${view === key ? " is-active" : ""}`}
              aria-current={view === key ? "page" : undefined}
              onClick={() => onViewChange(key)}
            >
              {VIEW_LABELS[key]}
            </button>
          ))}
        </nav>
        <div className="sidebar-theme" role="group" aria-label="Theme">
          {(["dark", "light"] as Theme[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`theme-btn${theme === t ? " is-pressed" : ""}`}
              aria-pressed={theme === t}
              onClick={() => setTheme(t)}
            >
              {t === "dark" ? "Dark" : "Light"}
            </button>
          ))}
        </div>
        <div className="sidebar-footer">
          <div className="sidebar-user" aria-hidden>
            <span className="user-avatar">DE</span>
            <div>
              <strong>Demo operator</strong>
              <span>demo@aptosolutions.com</span>
            </div>
          </div>
          <button type="button" className="btn-ghost" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="aims-main">
        <header className="page-header">
          <div>
            <h1>{title}</h1>
            {subtitle && <p className="page-subtitle muted">{subtitle}</p>}
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
