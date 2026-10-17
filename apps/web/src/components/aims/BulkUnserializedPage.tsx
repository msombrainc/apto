import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createJobAsset,
  getJob,
  listReferenceItems,
  searchPartNumbers,
  type Job,
  type ReferenceItem,
} from "../../api";
import {
  MAX_BULK_QUANTITY,
  MIN_BULK_QUANTITY,
  UNIDENTIFIED_PART_NUMBER,
  createdAptoIdsCsv,
  parseBulkQuantity,
} from "../../lib/bulkUnserialized";
import { jobPath } from "../../routing/paths";
import { AimsButton } from "./Button";
import { AlertBanner } from "./AlertBanner";
import { DataTable } from "./DataTable";

type Props = {
  jobId: string;
};

type Phase = "form" | "creating" | "results";

export function BulkUnserializedPage({ jobId }: Props) {
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [partQuery, setPartQuery] = useState("");
  const [partNumberId, setPartNumberId] = useState("");
  const [partLabel, setPartLabel] = useState("");
  const [quantityRaw, setQuantityRaw] = useState("10");
  const [grade, setGrade] = useState("");
  const [status, setStatus] = useState("");
  const [locationId, setLocationId] = useState("");
  const [partOptions, setPartOptions] = useState<{ id: string; number: string }[]>([]);
  const [grades, setGrades] = useState<ReferenceItem[]>([]);
  const [statuses, setStatuses] = useState<ReferenceItem[]>([]);
  const [locations, setLocations] = useState<ReferenceItem[]>([]);
  const [facilities, setFacilities] = useState<ReferenceItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [createdIds, setCreatedIds] = useState<string[]>([]);

  const quantity = useMemo(() => parseBulkQuantity(quantityRaw), [quantityRaw]);

  const facilityId = useMemo(() => {
    if (!job?.facilityCode) return null;
    const match = facilities.find(
      (f) => f.code.toUpperCase() === job.facilityCode.toUpperCase(),
    );
    return match?.id ?? null;
  }, [facilities, job?.facilityCode]);

  useEffect(() => {
    void getJob(jobId)
      .then(setJob)
      .catch((e: Error) => setError(e.message));
  }, [jobId]);

  useEffect(() => {
    void (async () => {
      try {
        const [g, s, f, loc] = await Promise.all([
          listReferenceItems("grade", { pageSize: 100 }),
          listReferenceItems("asset-status", { pageSize: 100 }),
          listReferenceItems("facility", { pageSize: 20 }),
          listReferenceItems("location", { pageSize: 200 }),
        ]);
        setGrades(g.items);
        setStatuses(s.items);
        setFacilities(f.items);
        setLocations(loc.items);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load reference data");
      }
    })();
  }, []);

  const facilityLocations = useMemo(() => {
    if (!facilityId) return locations;
    return locations.filter((l) => l.parentId === facilityId);
  }, [locations, facilityId]);

  const searchParts = useCallback(async () => {
    const q = partQuery.trim();
    if (!q) {
      setPartOptions([]);
      return;
    }
    const items = await searchPartNumbers(q);
    setPartOptions(items.map((p) => ({ id: p.id, number: p.number })));
  }, [partQuery]);

  const selectPart = (id: string, number: string) => {
    setPartNumberId(id);
    setPartLabel(number);
    setPartQuery(number);
    setPartOptions([]);
  };

  const pickUnidentified = async () => {
    setError(null);
    try {
      const items = await searchPartNumbers(UNIDENTIFIED_PART_NUMBER);
      const match = items.find(
        (p) => p.number.toUpperCase() === UNIDENTIFIED_PART_NUMBER,
      );
      if (!match) {
        setError(`${UNIDENTIFIED_PART_NUMBER} part number is not seeded on the server.`);
        return;
      }
      selectPart(match.id, match.number);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Part search failed");
    }
  };

  const canSubmit =
    partNumberId !== "" && quantity !== null && phase === "form";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || quantity === null) return;
    setError(null);
    setPhase("creating");
    setTotal(quantity);
    setProgress(0);
    const ids: string[] = [];
    try {
      for (let i = 0; i < quantity; i += 1) {
        const asset = await createJobAsset(jobId, {
          partNumberId,
          grade: grade || undefined,
          status: status || undefined,
          locationId: locationId || undefined,
        });
        ids.push(asset.aptoId);
        setProgress(i + 1);
      }
      setCreatedIds(ids);
      setPhase("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk create failed");
      setPhase("form");
    }
  }

  function downloadCsv() {
    const blob = new Blob([createdAptoIdsCsv(createdIds)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `job-${jobId}-bulk-apto-ids.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page" data-testid="f7-bulk-import-page">
      <header className="page-header">
        <h1>Bulk add unserialized assets</h1>
        {job && (
          <p className="muted">
            {job.accountName} · {job.facilityCode}
          </p>
        )}
      </header>

      {error && <AlertBanner variant="error">{error}</AlertBanner>}

      {phase === "form" && (
        <form className="grid" onSubmit={(e) => void onSubmit(e)}>
          <label>
            Part number
            <input
              data-testid="f7-part-search"
              value={partQuery}
              onChange={(ev) => setPartQuery(ev.target.value)}
              onBlur={() => void searchParts()}
              placeholder="Search part numbers"
            />
          </label>
          {partOptions.length > 0 && (
            <ul className="part-suggestions">
              {partOptions.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => selectPart(p.id, p.number)}>
                    {p.number}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <AimsButton type="button" variant="secondary" onClick={() => void pickUnidentified()}>
            Use {UNIDENTIFIED_PART_NUMBER}
          </AimsButton>
          {partLabel && <p className="muted">Selected: {partLabel}</p>}

          <label>
            Quantity ({MIN_BULK_QUANTITY}–{MAX_BULK_QUANTITY})
            <input
              data-testid="f7-quantity"
              inputMode="numeric"
              value={quantityRaw}
              onChange={(ev) => setQuantityRaw(ev.target.value)}
            />
          </label>
          {quantityRaw.trim() !== "" && quantity === null && (
            <p className="field-error">Enter a whole number from {MIN_BULK_QUANTITY} to {MAX_BULK_QUANTITY}.</p>
          )}

          <label>
            Grade (optional)
            <select data-testid="f7-grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
              <option value="">—</option>
              {grades.map((g) => (
                <option key={g.id} value={g.code}>{g.code} — {g.name}</option>
              ))}
            </select>
          </label>

          <label>
            Status (optional)
            <select data-testid="f7-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">—</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.code}>{s.code} — {s.name}</option>
              ))}
            </select>
          </label>

          <label>
            Location (optional)
            <select
              data-testid="f7-location"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
            >
              <option value="">—</option>
              {facilityLocations.map((l) => (
                <option key={l.id} value={l.id}>{l.code} — {l.name}</option>
              ))}
            </select>
          </label>

          <AimsButton type="submit" variant="primary" disabled={!canSubmit}>
            Create assets
          </AimsButton>
        </form>
      )}

      {phase === "creating" && (
        <p data-testid="f7-progress">
          Creating {progress} of {total}…
        </p>
      )}

      {phase === "results" && (
        <section>
          <p>Created {createdIds.length} assets.</p>
          <DataTable
            ariaLabel="Created Apto IDs"
            tableTestId="f7-results-table"
            columns={[{ id: "id", header: "Apto ID", cell: (row) => row }]}
            rows={createdIds}
            rowKey={(row) => row}
          />
          <div className="button-row">
            <AimsButton variant="secondary" onClick={downloadCsv}>
              Download CSV
            </AimsButton>
            <Link to={jobPath(jobId)}>
              <AimsButton variant="primary">Back to job</AimsButton>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
