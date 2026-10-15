import type { ReactNode } from "react";
import { BrandMark } from "./BrandMark";
import { useTheme, type Theme } from "./theme";
import { IconMoon, IconSun } from "./components/aims/icons";

export type AppView = "accounts" | "jobs" | "inventory" | "reference-data";

type AppShellProps = {
  view: AppView;
  onViewChange: (view: AppView) => void;
  onSignOut: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

const OPERATIONS_VIEWS: AppView[] = ["accounts", "jobs", "inventory"];

const VIEW_LABELS: Record<AppView, string> = {
  accounts: "Accounts",
  jobs: "Jobs & SLA",
  inventory: "Inventory",
  "reference-data": "Reference Data",
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
          <BrandMark />
          <span className="sidebar-product">AIMS</span>
        </div>
        <nav className="sidebar-nav" aria-label="Operations">
          {OPERATIONS_VIEWS.map((key) => (
            <button
              key={key}
              type="button"
              className={`sidebar-nav-btn${view === key ? " is-active" : ""}`}
              aria-current={view === key ? "page" : undefined}
              onClick={() => onViewChange(key)}
            >
              {view === key && <span className="sidebar-nav-dot" aria-hidden />}
              {VIEW_LABELS[key]}
            </button>
          ))}
        </nav>
        <nav className="sidebar-nav sidebar-nav--admin" aria-label="Administration">
          <span className="sidebar-nav-label">Admin</span>
          <button
            type="button"
            className={`sidebar-nav-btn${view === "reference-data" ? " is-active" : ""}`}
            aria-current={view === "reference-data" ? "page" : undefined}
            onClick={() => onViewChange("reference-data")}
          >
            {view === "reference-data" && <span className="sidebar-nav-dot" aria-hidden />}
            {VIEW_LABELS["reference-data"]}
          </button>
        </nav>
        <div className="sidebar-theme" role="group" aria-label="Theme">
          <div className="theme-segment">
            {(["dark", "light"] as Theme[]).map((t) => (
              <button
                key={t}
                type="button"
                className={`theme-segment-btn${theme === t ? " is-pressed" : ""}`}
                aria-pressed={theme === t}
                aria-label={t === "dark" ? "Dark theme" : "Light theme"}
                onClick={() => setTheme(t)}
              >
                {t === "dark" ? <IconMoon /> : <IconSun />}
              </button>
            ))}
          </div>
        </div>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="user-avatar" aria-hidden>DE</span>
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
