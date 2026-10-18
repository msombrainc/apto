import type { Job } from "../../api";

export function jobSlaPillClass(status: Job["slaStatus"]): string {
  return `sla-pill sla-pill--${status}`;
}

export function formatJobSlaStatusLabel(status: Job["slaStatus"]): string {
  return status.replace(/-/g, " ");
}
