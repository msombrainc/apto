type SlaSegmentBarProps = {
  receivingDays: number;
  processingDays: number;
  shippingDays: number;
};

export function slaTotalDays(r: number, p: number, s: number): number {
  return r + p + s;
}

export function formatSlaSummary(r: number, p: number, s: number): string {
  const total = slaTotalDays(r, p, s);
  if (total <= 0) return "Not set";
  return `${r}d · ${p}d · ${s}d = ${total}d`;
}

export function SlaSegmentBar({ receivingDays, processingDays, shippingDays }: SlaSegmentBarProps) {
  const total = slaTotalDays(receivingDays, processingDays, shippingDays);
  const label = formatSlaSummary(receivingDays, processingDays, shippingDays);

  if (total <= 0) {
    return <span className="sla-summary muted">Not set</span>;
  }

  const segments = [
    { key: "r", days: receivingDays, className: "sla-seg sla-seg--receiving" },
    { key: "p", days: processingDays, className: "sla-seg sla-seg--processing" },
    { key: "s", days: shippingDays, className: "sla-seg sla-seg--shipping" },
  ];

  return (
    <div className="sla-segment-cell">
      <div className="sla-segment-bar" aria-hidden>
        {segments.map((seg) => (
          <span
            key={seg.key}
            className={seg.className}
            style={{ flexGrow: Math.max(seg.days, 0.001) }}
          />
        ))}
      </div>
      <span className="sla-summary">{label}</span>
      <span className="sr-only">{`SLA ${label}`}</span>
    </div>
  );
}
