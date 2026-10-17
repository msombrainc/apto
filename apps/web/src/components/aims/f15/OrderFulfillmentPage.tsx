import { useMemo, useState } from "react";
import { AimsButton } from "../Button";
import { DataTable } from "../DataTable";
import { FacilityPills } from "../FacilityPills";
import { PrototypeBanner } from "../PrototypeBanner";
import { F15_UNSHIPPED_INVOICES, type F15UnshippedInvoice } from "../../../prototype/f15SampleData";

type ScanStep = "pull" | "pack";
type ScanFeedback = "match" | "not-on-invoice" | "already-scanned" | null;

type FulfillmentStage = "open" | "staged" | "shipped";

function invoiceForFacility(facility: string): F15UnshippedInvoice | undefined {
  return F15_UNSHIPPED_INVOICES.find((inv) => inv.facility === facility);
}

export function OrderFulfillmentPage() {
  const facilities = useMemo(
    () => [...new Set(F15_UNSHIPPED_INVOICES.map((i) => i.facility))],
    [],
  );
  const [facility, setFacility] = useState(facilities[0] ?? "GA");
  const [invoiceId, setInvoiceId] = useState(
    () => invoiceForFacility(facilities[0] ?? "GA")?.id ?? "",
  );
  const [step, setStep] = useState<ScanStep>("pull");
  const [scanInput, setScanInput] = useState("");
  const [feedback, setFeedback] = useState<ScanFeedback>(null);
  const [pullScanned, setPullScanned] = useState<Set<string>>(() => new Set());
  const [packScanned, setPackScanned] = useState<Set<string>>(() => new Set());
  const [weightLbs, setWeightLbs] = useState("");
  const [lengthIn, setLengthIn] = useState("");
  const [widthIn, setWidthIn] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [tracking, setTracking] = useState("");
  const [stage, setStage] = useState<FulfillmentStage>("open");

  const invoicesAtFacility = F15_UNSHIPPED_INVOICES.filter((i) => i.facility === facility);
  const invoice =
    F15_UNSHIPPED_INVOICES.find((i) => i.id === invoiceId)
    ?? invoicesAtFacility[0];

  const aptoIds = useMemo(
    () => new Set(invoice?.lines.map((l) => l.aptoId) ?? []),
    [invoice],
  );
  const activeScanned = step === "pull" ? pullScanned : packScanned;

  function resetScans() {
    setPullScanned(new Set());
    setPackScanned(new Set());
    setStep("pull");
    setFeedback(null);
    setScanInput("");
    setStage("open");
    setTracking("");
  }

  function onFacilityChange(code: string) {
    setFacility(code);
    const first = invoiceForFacility(code);
    setInvoiceId(first?.id ?? "");
    resetScans();
  }

  function submitScan() {
    const id = scanInput.trim().toUpperCase();
    setScanInput("");
    if (!id || !invoice) return;
    if (!aptoIds.has(id)) {
      setFeedback("not-on-invoice");
      return;
    }
    if (activeScanned.has(id)) {
      setFeedback("already-scanned");
      return;
    }
    setFeedback("match");
    if (step === "pull") {
      setPullScanned((prev) => new Set(prev).add(id));
    } else {
      setPackScanned((prev) => new Set(prev).add(id));
    }
  }

  const allPulled = invoice && pullScanned.size === invoice.lines.length;
  const allPacked = invoice && packScanned.size === invoice.lines.length;

  return (
    <div className="dashboard-stack" data-testid="f15-order-fulfillment">
      <PrototypeBanner />

      <section className="dashboard-panel">
        <div className="dashboard-actions">
          <FacilityPills facilities={facilities} value={facility} onChange={onFacilityChange} />
          <label className="field-inline">
            <span className="field-label">Invoice</span>
            <select
              className="aims-select"
              value={invoice?.id ?? ""}
              onChange={(e) => {
                setInvoiceId(e.target.value);
                resetScans();
              }}
              data-testid="f15-invoice-picker"
            >
              {invoicesAtFacility.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.number} — {inv.accountName}
                </option>
              ))}
            </select>
          </label>
        </div>

        {invoice && (
          <DataTable
            ariaLabel="Invoice lines"
            rows={invoice.lines}
            rowKey={(l) => l.aptoId}
            columns={[
              { id: "apto", header: "Apto ID", cell: (l) => l.aptoId },
              { id: "desc", header: "Description", cell: (l) => l.description },
              {
                id: "pull",
                header: "Pull",
                cell: (l) => (pullScanned.has(l.aptoId) ? "✓" : "—"),
              },
              {
                id: "pack",
                header: "Pack",
                cell: (l) => (packScanned.has(l.aptoId) ? "✓" : "—"),
              },
            ]}
          />
        )}
      </section>

      <section className="dashboard-panel" aria-labelledby="f15-scan-title">
        <h2 id="f15-scan-title" className="panel-title">
          {step === "pull" ? "Pull scan" : "Pack scan"}
        </h2>
        <div className="dashboard-actions">
          <AimsButton
            variant={step === "pull" ? "primary" : "secondary"}
            onClick={() => setStep("pull")}
          >
            Pull
          </AimsButton>
          <AimsButton
            variant={step === "pack" ? "primary" : "secondary"}
            onClick={() => setStep("pack")}
            disabled={!allPulled}
          >
            Pack
          </AimsButton>
        </div>
        <div className="f15-scan-row">
          <input
            className="aims-input"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitScan();
              }
            }}
            placeholder="Scan or type Apto ID"
            aria-label="Scan Apto ID"
            data-testid="f15-scan-input"
          />
          <AimsButton variant="primary" onClick={submitScan}>Apply scan</AimsButton>
        </div>
        {feedback === "match" && (
          <p className="f15-scan-feedback f15-scan-feedback--match" role="status">Matched</p>
        )}
        {feedback === "not-on-invoice" && (
          <p className="f15-scan-feedback f15-scan-feedback--error" role="status">Not on invoice</p>
        )}
        {feedback === "already-scanned" && (
          <p className="f15-scan-feedback f15-scan-feedback--warn" role="status">Already scanned</p>
        )}
      </section>

      <section className="dashboard-panel" aria-labelledby="f15-ship-title">
        <h2 id="f15-ship-title" className="panel-title">Weight &amp; ship</h2>
        <div className="f15-dims-grid">
          <label className="field-inline">
            <span className="field-label">Weight (lb)</span>
            <input
              className="aims-input"
              type="number"
              min="0"
              value={weightLbs}
              onChange={(e) => setWeightLbs(e.target.value)}
            />
          </label>
          <label className="field-inline">
            <span className="field-label">L (in)</span>
            <input
              className="aims-input"
              type="number"
              min="0"
              value={lengthIn}
              onChange={(e) => setLengthIn(e.target.value)}
            />
          </label>
          <label className="field-inline">
            <span className="field-label">W (in)</span>
            <input
              className="aims-input"
              type="number"
              min="0"
              value={widthIn}
              onChange={(e) => setWidthIn(e.target.value)}
            />
          </label>
          <label className="field-inline">
            <span className="field-label">H (in)</span>
            <input
              className="aims-input"
              type="number"
              min="0"
              value={heightIn}
              onChange={(e) => setHeightIn(e.target.value)}
            />
          </label>
        </div>
        <div className="dashboard-actions">
          <AimsButton
            variant="secondary"
            disabled={!allPacked || stage !== "open"}
            onClick={() => setStage("staged")}
            data-testid="f15-mark-staged"
          >
            Mark staged
          </AimsButton>
          {stage === "staged" && (
            <>
              <label className="field-inline">
                <span className="field-label">Tracking #</span>
                <input
                  className="aims-input"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  data-testid="f15-tracking"
                />
              </label>
              <AimsButton
                variant="primary"
                disabled={!tracking.trim()}
                onClick={() => setStage("shipped")}
                data-testid="f15-mark-shipped"
              >
                Mark shipped
              </AimsButton>
            </>
          )}
        </div>
        {stage === "shipped" && (
          <p className="muted" role="status" data-testid="f15-shipped-status">
            Shipped — tracking {tracking}
          </p>
        )}
      </section>
    </div>
  );
}
