import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  createJobAsset,
  createPartNumberAdmin,
  getJob,
  listCategories,
  listReferenceItems,
  lookupAssetByCode,
  searchPartNumbers,
  type Job,
} from "../../api";
import { jobPath } from "../../routing/paths";
import {
  MAX_IMPORT_ROWS,
  type ColumnMapping,
  type ImportField,
  type ParsedSheet,
  type ValidatedRow,
  buildSerialIndex,
  failedRowsCsv,
  guessColumnMapping,
  parseCsvText,
  validateImportRows,
} from "../../lib/spreadsheetImport";
import { parseXlsxBuffer } from "../../lib/spreadsheetImportXlsx";
import { AimsButton } from "./Button";
import { AlertBanner } from "./AlertBanner";
import { DataTable } from "./DataTable";

type Step = "upload" | "map" | "preview" | "importing" | "results";

const FIELD_LABELS: Record<ImportField, string> = {
  serialNumber: "Serial Number",
  partNumber: "Part Number",
  category: "Category (optional)",
  grade: "Grade (optional)",
};

type Props = {
  jobId: string;
};

type ImportSummary = {
  created: number;
  skipped: number;
  failed: number;
  failedRows: ValidatedRow[];
};

export function SpreadsheetImportPage({ jobId }: Props) {
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("upload");
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [unknownPartPolicy, setUnknownPartPolicy] = useState<"create" | "skip">("create");
  const [validated, setValidated] = useState<ValidatedRow[]>([]);
  const [validating, setValidating] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [gradeCodes, setGradeCodes] = useState<Set<string>>(new Set());
  const [categoryNames, setCategoryNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    void getJob(jobId)
      .then(setJob)
      .catch((e: Error) => setError(e.message));
    void Promise.all([
      listReferenceItems("grade", { pageSize: 200 }),
      listCategories({ pageSize: 200 }),
    ])
      .then(([grades, cats]) => {
        setGradeCodes(
          new Set(grades.items.map((g) => g.code.toLowerCase())),
        );
        const catMap = new Map<string, string>();
        for (const c of cats.items) {
          if (c.isActive) {
            catMap.set(c.name.toLowerCase(), c.id);
          }
        }
        setCategoryNames(catMap);
      })
      .catch(() => {
        /* preview will flag missing refs */
      });
  }, [jobId]);

  const onFile = useCallback(async (file: File) => {
    setError(null);
    try {
      const ext = file.name.toLowerCase();
      let parsed: ParsedSheet;
      if (ext.endsWith(".csv")) {
        const text = await file.text();
        parsed = parseCsvText(text);
      } else if (ext.endsWith(".xlsx") || ext.endsWith(".xls")) {
        const buf = await file.arrayBuffer();
        parsed = parseXlsxBuffer(buf);
      } else {
        throw new Error("Use a .csv or .xlsx file.");
      }
      if (parsed.rows.length === 0) {
        throw new Error("No data rows found in file.");
      }
      if (parsed.rows.length > MAX_IMPORT_ROWS) {
        throw new Error(
          `File has ${parsed.rows.length} rows; maximum is ${MAX_IMPORT_ROWS}.`,
        );
      }
      setSheet(parsed);
      setMapping(guessColumnMapping(parsed.headers));
      setStep("map");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read file.");
    }
  }, []);

  const onFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void onFile(file);
  };

  const runValidation = useCallback(async () => {
    if (!sheet) return;
    setValidating(true);
    setError(null);
    try {
      const serialsInFile = buildSerialIndex(sheet, mapping);
      const partCache = new Map<string, { id: string } | null>();
      const rows = await validateImportRows(sheet, mapping, {
        gradeCodes,
        categoryNames: new Set(categoryNames.keys()),
        serialsInFile,
        unknownPartPolicy,
        lookupSerial: async (serial) => {
          try {
            await lookupAssetByCode(serial);
            return true;
          } catch (e) {
            const msg = e instanceof Error ? e.message : "";
            if (msg.includes("no asset found") || /lookup failed: 404\b/.test(msg)) {
              return false;
            }
            throw e;
          }
        },
        resolvePartNumber: async (part) => {
          const key = part.toLowerCase();
          if (partCache.has(key)) {
            return partCache.get(key) ?? null;
          }
          const hits = await searchPartNumbers(part);
          const exact = hits.find((p) => p.number.toLowerCase() === key);
          const resolved = exact ? { id: exact.id } : null;
          partCache.set(key, resolved);
          return resolved;
        },
      });
      setValidated(rows);
      setStep("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Validation failed.");
    } finally {
      setValidating(false);
    }
  }, [sheet, mapping, gradeCodes, categoryNames, unknownPartPolicy]);

  const prevUnknownPartPolicyRef = useRef(unknownPartPolicy);
  useEffect(() => {
    if (step !== "preview" || !sheet) {
      prevUnknownPartPolicyRef.current = unknownPartPolicy;
      return;
    }
    if (prevUnknownPartPolicyRef.current === unknownPartPolicy) return;
    prevUnknownPartPolicyRef.current = unknownPartPolicy;
    void runValidation();
  }, [unknownPartPolicy, step, sheet, runValidation]);

  const okRows = useMemo(
    () => validated.filter((r) => r.status === "ok"),
    [validated],
  );

  const runImport = useCallback(async () => {
    if (!sheet || okRows.length === 0) return;
    setStep("importing");
    setImportProgress(0);
    let created = 0;
    let skipped = validated.filter((r) => r.status === "skipped").length;
    const failedRows: ValidatedRow[] = validated.filter((r) => r.status === "error");
    const partCache = new Map<string, string>();

    for (let i = 0; i < okRows.length; i++) {
      const row = okRows[i];
      try {
        let partId = partCache.get(row.partNumber.toLowerCase());
        if (!partId) {
          const hits = await searchPartNumbers(row.partNumber);
          const exact = hits.find(
            (p) => p.number.toLowerCase() === row.partNumber.toLowerCase(),
          );
          if (exact) {
            partId = exact.id;
          } else {
            const categoryId = row.category
              ? categoryNames.get(row.category.toLowerCase()) ?? null
              : null;
            const pn = await createPartNumberAdmin(row.partNumber, categoryId);
            partId = pn.id;
          }
          partCache.set(row.partNumber.toLowerCase(), partId);
        }
        await createJobAsset(jobId, {
          partNumberId: partId,
          serialNumber: row.serialNumber || null,
          grade: row.grade || null,
        });
        created++;
      } catch (e) {
        failedRows.push({
          ...row,
          status: "error",
          messages: [e instanceof Error ? e.message : "Import failed"],
        });
      }
      setImportProgress(i + 1);
    }

    setSummary({
      created,
      skipped,
      failed: failedRows.length,
      failedRows,
    });
    setStep("results");
  }, [sheet, okRows, validated, jobId, categoryNames]);

  const previewColumns = useMemo(
    () => [
      {
        id: "row",
        header: "#",
        cell: (r: ValidatedRow) => r.index + 2,
      },
      {
        id: "part",
        header: "Part",
        cell: (r: ValidatedRow) => r.partNumber || "—",
      },
      {
        id: "serial",
        header: "Serial",
        cell: (r: ValidatedRow) => r.serialNumber || "—",
      },
      {
        id: "status",
        header: "Status",
        cell: (r: ValidatedRow) => (
          <span className={`import-status import-status--${r.status}`}>{r.status}</span>
        ),
      },
      {
        id: "messages",
        header: "Notes",
        cell: (r: ValidatedRow) => r.messages.join("; ") || "—",
      },
    ],
    [],
  );

  return (
    <div className="page-stack" data-testid="f6-spreadsheet-import-page">
      <header className="page-header">
        <h1>Import assets from spreadsheet</h1>
        {job && (
          <p className="muted">
            Job {job.id.slice(0, 8)}… · {job.accountName}
            {job.facilityCode ? ` · ${job.facilityCode}` : ""}
          </p>
        )}
        <Link to={jobPath(jobId)} className="text-link">← Back to job</Link>
      </header>

      {error && <AlertBanner message={error} />}

      {step === "upload" && (
        <section className="import-upload">
          <p>Upload a client `.csv` or `.xlsx` (up to 500 rows).</p>
          <input
            type="file"
            accept=".csv,.xlsx"
            data-testid="f6-upload-input"
            onChange={onFileInput}
          />
        </section>
      )}

      {step === "map" && sheet && (
        <section data-testid="f6-column-map">
          <h2>Map columns</h2>
          <p className="muted">{sheet.rows.length} data rows detected.</p>
          <div className="form-grid">
            {(Object.keys(FIELD_LABELS) as ImportField[]).map((field) => (
              <label key={field}>
                {FIELD_LABELS[field]}
                <select
                  value={mapping[field] ?? ""}
                  onChange={(e) =>
                    setMapping((m) => ({
                      ...m,
                      [field]: e.target.value || undefined,
                    }))
                  }
                >
                  <option value="">— not mapped —</option>
                  {sheet.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <div className="dashboard-actions">
            <AimsButton variant="secondary" onClick={() => setStep("upload")}>
              Choose another file
            </AimsButton>
            <AimsButton
              onClick={() => void runValidation()}
              disabled={!mapping.partNumber || validating}
            >
              {validating ? "Validating…" : "Preview rows"}
            </AimsButton>
          </div>
        </section>
      )}

      {step === "preview" && (
        <section>
          <h2>Preview</h2>
          <fieldset className="import-policy">
            <legend>Unknown part numbers</legend>
            <label>
              <input
                type="radio"
                name="unknownPart"
                checked={unknownPartPolicy === "create"}
                onChange={() => setUnknownPartPolicy("create")}
              />
              Create missing part numbers
            </label>
            <label>
              <input
                type="radio"
                name="unknownPart"
                checked={unknownPartPolicy === "skip"}
                onChange={() => setUnknownPartPolicy("skip")}
              />
              Skip rows with unknown parts
            </label>
          </fieldset>
          <DataTable
            ariaLabel="Import preview"
            tableTestId="f6-preview-table"
            columns={previewColumns}
            rows={validated}
            rowKey={(r) => String(r.index)}
          />
          <div className="dashboard-actions">
            <AimsButton variant="secondary" onClick={() => setStep("map")}>
              Edit mapping
            </AimsButton>
            <AimsButton
              onClick={() => void runImport()}
              disabled={okRows.length === 0 || validating}
            >
              {validating ? "Re-validating…" : `Start import (${okRows.length} rows)`}
            </AimsButton>
          </div>
        </section>
      )}

      {step === "importing" && (
        <section>
          <p>Importing… {importProgress} / {okRows.length}</p>
          <progress
            max={okRows.length}
            value={importProgress}
            data-testid="f6-import-progress"
          />
        </section>
      )}

      {step === "results" && summary && (
        <section data-testid="f6-import-results">
          <h2>Import complete</h2>
          <ul className="import-summary">
            <li>Created: {summary.created}</li>
            <li>Skipped: {summary.skipped}</li>
            <li>Failed: {summary.failed}</li>
          </ul>
          {summary.failedRows.length > 0 && (
            <AimsButton
              variant="secondary"
              onClick={() => {
                const blob = new Blob([failedRowsCsv(summary.failedRows)], {
                  type: "text/csv",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "import-failed-rows.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download failed rows
            </AimsButton>
          )}
          <Link to={jobPath(jobId)} className="aims-btn aims-btn--primary">
            Back to job
          </Link>
        </section>
      )}
    </div>
  );
}
