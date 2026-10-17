const PROTOTYPE_BANNER_TEXT = "Prototype — sample data, not connected";

export function PrototypeBanner() {
  return (
    <div
      className="aims-alert aims-alert--prototype"
      role="alert"
      data-testid="f15-prototype-banner"
    >
      <span className="aims-alert__icon aims-alert__icon--prototype" aria-hidden>
        i
      </span>
      <span>{PROTOTYPE_BANNER_TEXT}</span>
    </div>
  );
}
