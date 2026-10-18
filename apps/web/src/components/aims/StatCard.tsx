import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: ReactNode;
  onClick?: () => void;
  active?: boolean;
};

export function StatCard({ label, value, sublabel, icon, onClick, active }: StatCardProps) {
  const ariaLabel = sublabel ? `${label}: ${value}. ${sublabel}` : `${label}: ${value}`;
  const interactive = Boolean(onClick);

  return (
    <div
      className={`stat-card${interactive ? " stat-card--interactive" : ""}${active ? " stat-card--active" : ""}`}
      role={interactive ? "button" : "group"}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? active : undefined}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <div className="stat-card__head">
        <span className="stat-card__label">{label}</span>
        {icon && (
          <span className="stat-card__icon" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <div className="stat-card__value" aria-hidden="true">{value}</div>
      {sublabel && (
        <div className="stat-card__sublabel muted" aria-hidden="true">{sublabel}</div>
      )}
    </div>
  );
}
