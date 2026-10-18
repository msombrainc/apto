import { type ReactNode, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { BrandMark } from "./BrandMark";
import { useTheme, type Theme } from "./theme";
import { IconMoon, IconSun } from "./components/aims/icons";
import { GlobalAssetLookup } from "./components/aims/GlobalAssetLookup";
import { ModuleMapNav } from "./components/aims/ModuleMapNav";
import { ROUTES } from "./routing/paths";
import type { AppView } from "./routing/moduleMap";
import { installDocumentScrollLock } from "./shellScrollLock";

type AppShellProps = {
  view: AppView;
  onSignOut: () => void;
  onGlobalLookupError: (message: string | null) => void;
  title: string;
  subtitle?: string;
  showGlobalLookup?: boolean;
  children: ReactNode;
};

const PRIMARY_NAV: {
  view: AppView;
  label: string;
  to: string;
  isActive?: (pathname: string) => boolean;
}[] = [
  { view: "accounts", label: "Accounts", to: ROUTES.accounts },
  { view: "jobs", label: "Jobs & SLA", to: ROUTES.jobs },
  {
    view: "inventory",
    label: "Inventory",
    to: ROUTES.inventory,
    isActive: (pathname: string) => pathname.startsWith("/inventory"),
  },
  { view: "scan", label: "Warehouse scan", to: ROUTES.scan },
];

const ADMIN_NAV: { view: AppView; label: string; to: string }[] = [
  { view: "reference-data", label: "Reference Data", to: ROUTES.referenceData },
  { view: "qbo-sync", label: "QuickBooks Sync", to: ROUTES.qboSync },
  { view: "part-numbers", label: "Part Numbers", to: ROUTES.partNumbers },
];

function navClass(isActive: boolean): string {
  return `sidebar-nav-btn${isActive ? " is-active" : ""}`;
}

export function AppShell({
  view,
  onSignOut,
  onGlobalLookupError,
  title,
  subtitle,
  showGlobalLookup = true,
  children,
}: AppShellProps) {
  const { theme, setTheme } = useTheme();
  const { pathname } = useLocation();

  // Belt-and-suspenders for apto#112: keep document scroll at 0 while shell is mounted.
  useEffect(() => installDocumentScrollLock(), []);

  return (
    <div className="aims-app">
      <aside className="aims-sidebar" aria-label="Main menu">
        <div className="sidebar-brand">
          <BrandMark />
          <span className="sidebar-product">AIMS</span>
        </div>
        <nav className="sidebar-nav" aria-label="Operations">
          {PRIMARY_NAV.map((item) => (
            <NavLink
              key={item.view}
              to={item.to}
              className={() =>
                navClass(item.isActive ? item.isActive(pathname) : pathname.startsWith(item.to))
              }
              aria-current={view === item.view ? "page" : undefined}
            >
              {view === item.view && <span className="sidebar-nav-dot" aria-hidden />}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <nav className="sidebar-nav sidebar-nav--admin" aria-label="Administration">
          <span className="sidebar-nav-label">Admin</span>
          {ADMIN_NAV.map((item) => (
            <NavLink
              key={item.view}
              to={item.to}
              className={({ isActive }) => navClass(isActive)}
              aria-current={view === item.view ? "page" : undefined}
            >
              {view === item.view && <span className="sidebar-nav-dot" aria-hidden />}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <ModuleMapNav />
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
          <div className="page-header-text">
            <h1>{title}</h1>
            {subtitle && <p className="page-subtitle muted">{subtitle}</p>}
          </div>
          {showGlobalLookup && <GlobalAssetLookup onError={onGlobalLookupError} />}
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
