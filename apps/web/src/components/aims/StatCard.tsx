import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: ReactNode;
};

export function StatCard({ label, value, sublabel, icon }: StatCardProps) {
  const ariaLabel = sublabel ? `${label}: ${value}. ${sublabel}` : `${label}: ${value}`;

  return (
    <div className="stat-card" role="group" aria-label={ariaLabel}>
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
