type SlaSegmentBarProps = {
  receivingDays: number;
  processingDays: number;
  shippingDays: number;
  /** Table cells use bar-only; detail panels show summary text. */
  variant?: "full" | "bar-only";
};

export function slaTotalDays(r: number, p: number, s: number): number {
  return r + p + s;
}

export function formatSlaSummary(r: number, p: number, s: number): string {
  const total = slaTotalDays(r, p, s);
  if (total <= 0) return "Not set";
  return `${r}d input · ${p}d settlement · ${s}d sales = ${total}d`;
}

export function SlaSegmentBar({
  receivingDays,
  processingDays,
  shippingDays,
  variant = "full",
}: SlaSegmentBarProps) {
  const total = slaTotalDays(receivingDays, processingDays, shippingDays);
  const label = formatSlaSummary(receivingDays, processingDays, shippingDays);

  if (total <= 0) {
    if (variant === "bar-only") {
      return (
        <div className="sla-segment-cell sla-segment-cell--bar-only">
          <span className="sla-empty muted" aria-label="Not set">—</span>
        </div>
      );
    }
    return <span className="sla-summary muted">Not set</span>;
  }

  const segments = [
    { key: "r", days: receivingDays, className: "sla-seg sla-seg--receiving" },
    { key: "p", days: processingDays, className: "sla-seg sla-seg--processing" },
    { key: "s", days: shippingDays, className: "sla-seg sla-seg--shipping" },
  ];

  const barOnly = variant === "bar-only";

  return (
    <div className={`sla-segment-cell${barOnly ? " sla-segment-cell--bar-only" : ""}`}>
      <div
        className="sla-segment-bar"
        aria-hidden={barOnly ? undefined : true}
        aria-label={barOnly ? label : undefined}
        role={barOnly ? "img" : undefined}
      >
        {segments.map((seg) => (
          <span
            key={seg.key}
            className={seg.className}
            style={{ flexGrow: Math.max(seg.days, 0.001) }}
          />
        ))}
      </div>
      {!barOnly && <span className="sla-summary">{label}</span>}
    </div>
  );
}
