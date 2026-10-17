import {
  F15_PROTOTYPE_BANNER_TEST_ID,
  F15_PROTOTYPE_BANNER_TEXT,
} from "../../f15Contracts";

export function PrototypeBanner() {
  return (
    <div
      className="aims-alert aims-alert--prototype"
      role="alert"
      data-testid={F15_PROTOTYPE_BANNER_TEST_ID}
    >
      <span className="aims-alert__icon aims-alert__icon--prototype" aria-hidden>
        i
      </span>
      <span>{F15_PROTOTYPE_BANNER_TEXT}</span>
    </div>
  );
}
