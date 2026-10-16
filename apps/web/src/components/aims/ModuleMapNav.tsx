import { useState } from "react";
import { NavLink } from "react-router-dom";
import { moduleGroups, type ModuleEntry } from "../../routing/moduleMap";

function availabilityLabel(entry: ModuleEntry): string {
  if (entry.availability === "d2") return "D2";
  if (entry.availability === "prototype") return entry.phaseTag ?? "Prototype";
  return entry.phaseTag ?? "Future";
}

export function ModuleMapNav() {
  const [open, setOpen] = useState(false);
  const groups = moduleGroups();

  return (
    <div className="sidebar-module-map">
      <button
        type="button"
        className="sidebar-module-map-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Module map
        <span className="sidebar-module-map-chevron" aria-hidden>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <nav className="sidebar-module-map-panel" aria-label="AIMS module map">
          {groups.map(({ group, entries }) => (
            <div key={group} className="module-map-group">
              <span className="module-map-group-label">{group}</span>
              <ul className="module-map-list">
                {entries.map((entry) => {
                  const tag = availabilityLabel(entry);
                  if (entry.path && entry.availability === "d2") {
                    return (
                      <li key={entry.id}>
                        <NavLink
                          to={entry.path}
                          className={({ isActive }) =>
                            `module-map-link${isActive ? " is-active" : ""}`
                          }
                        >
                          <span>{entry.label}</span>
                          <span className="module-map-tag module-map-tag--d2">{tag}</span>
                        </NavLink>
                      </li>
                    );
                  }
                  return (
                    <li key={entry.id}>
                      <span className="module-map-link is-disabled" aria-disabled="true">
                        <span>{entry.label}</span>
                        <span className="module-map-tag">{tag}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      )}
    </div>
  );
}
