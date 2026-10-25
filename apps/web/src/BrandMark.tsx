type BrandMarkProps = {
  /** Sidebar uses preview SoT SVG mark; login keeps compact inline mark. */
  variant?: "sidebar" | "inline";
};

export function BrandMark({ variant = "inline" }: BrandMarkProps) {
  if (variant === "sidebar") {
    return (
      <div className="brand-mark brand-mark--sidebar" aria-label="Apto Solutions">
        <svg
          className="brand-disc-svg"
          width="36"
          height="36"
          viewBox="0 0 36 36"
          aria-hidden
          focusable="false"
        >
          <circle cx="18" cy="18" r="18" fill="var(--aims-brand-amber, #f9a51f)" />
          <text
            x="18"
            y="18"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#ffffff"
            fontSize="11"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
          >
            Apto
          </text>
        </svg>
        <span className="brand-suffix">Solutions</span>
      </div>
    );
  }

  return (
    <div className="brand-mark" aria-label="Apto Solutions">
      <span className="brand-dot" aria-hidden />
      <span className="brand-name">Apto</span>
      <span className="brand-suffix">Solutions</span>
    </div>
  );
}
