import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: ReactNode;
};

export function StatCard({ label, value, sublabel, icon }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card__head">
        <span className="stat-card__label">{label}</span>
        {icon && <span className="stat-card__icon">{icon}</span>}
      </div>
      <div className="stat-card__value">{value}</div>
      {sublabel && <div className="stat-card__sublabel muted">{sublabel}</div>}
    </div>
  );
}
