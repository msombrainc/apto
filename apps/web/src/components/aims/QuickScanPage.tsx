import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AssetLookupResult,
  ReferenceItem,
  listReferenceItems,
  lookupAssetByCode,
  updateAsset,
} from "../../api";
import { DEMO_USER } from "../../demoAuth";
import { newId } from "../../id";
import { AlertBanner } from "./AlertBanner";
import { AimsButton } from "./Button";
import { DataTable } from "./DataTable";
import {
  buildScanApplyBody,
  buildScanUndoBody,
  formatScanFieldChange,
  scanPresetNeedsAsk,
  type FieldMode,
  type PresetFields,
  type ScanPreset,
} from "../../quickScanLogic";

const PRESET_STORAGE_KEY = "apto.f8Scan.presets.v1";

export type { ScanPreset } from "../../quickScanLogic";

type SessionLogRow = {
  id: string;
  time: string;
  code: string;
  aptoId: string;
  fieldsChanged: string;
  result: string;
};

type UndoState = {
  assetId: string;
  grade: string | null;
  status: string | null;
  locationId: string | null;
};

type PendingAsk = {
  code: string;
  lookup: AssetLookupResult;
};

function loadPresets(): ScanPreset[] {
  try {
    const raw = localStorage.getItem(PRESET_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScanPreset[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePresets(presets: ScanPreset[]) {
  localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
}

function playTone(freq: number, durationMs: number) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, durationMs);
  } catch {
    /* visual-only when audio blocked */
  }
}

export function QuickScanPage() {
  const codeInputRef = useRef<HTMLInputElement>(null);
  const [presets, setPresets] = useState<ScanPreset[]>(() => loadPresets());
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorName, setEditorName] = useState("");
  const [editorGlobal, setEditorGlobal] = useState(false);
  const [editorFields, setEditorFields] = useState<PresetFields>({
    gradeMode: "ask",
    statusMode: "ask",
    locationMode: "ask",
  });

  const [grades, setGrades] = useState<ReferenceItem[]>([]);
  const [statuses, setStatuses] = useState<ReferenceItem[]>([]);
  const [locations, setLocations] = useState<ReferenceItem[]>([]);
  const [facilities, setFacilities] = useState<ReferenceItem[]>([]);
  const [refError, setRefError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [failureMsg, setFailureMsg] = useState<string | null>(null);
  const [sessionLog, setSessionLog] = useState<SessionLogRow[]>([]);
  const [undo, setUndo] = useState<UndoState | null>(null);
  const [pendingAsk, setPendingAsk] = useState<PendingAsk | null>(null);
  const [askGrade, setAskGrade] = useState("");
  const [askStatus, setAskStatus] = useState("");
  const [askLocationId, setAskLocationId] = useState("");

  const visiblePresets = useMemo(
    () =>
      presets.filter(
        (p) => p.isGlobal || p.createdBy === DEMO_USER,
      ),
    [presets],
  );

  const selectedPreset = visiblePresets.find((p) => p.id === selectedPresetId)
    ?? visiblePresets[0]
    ?? null;

  useEffect(() => {
    if (!selectedPresetId && visiblePresets.length > 0)
      setSelectedPresetId(visiblePresets[0].id);
  }, [visiblePresets, selectedPresetId]);

  useEffect(() => {
    if (presets.length === 0) {
      const seed: ScanPreset = {
        id: newId(),
        name: "Audit intake",
        isGlobal: true,
        createdBy: DEMO_USER,
        fields: {
          status: "IN-AUDIT",
          statusMode: "fixed",
          gradeMode: "ask",
          locationMode: "ask",
        },
      };
      const next = [seed];
      setPresets(next);
      savePresets(next);
      setSelectedPresetId(seed.id);
    }
  }, [presets.length]);

  useEffect(() => {
    void (async () => {
      setRefError(null);
      try {
        const [g, s, f] = await Promise.all([
          listReferenceItems("grade", { pageSize: 100 }),
          listReferenceItems("asset-status", { pageSize: 100 }),
          listReferenceItems("facility", { pageSize: 20 }),
        ]);
        setGrades(g.items);
        setStatuses(s.items);
        setFacilities(f.items);
      } catch (e) {
        setRefError(e instanceof Error ? e.message : "Failed to load reference data");
      }
    })();
  }, []);

  const focusCode = useCallback(() => {
    codeInputRef.current?.focus();
  }, []);

  useEffect(() => {
    focusCode();
  }, [focusCode]);

  const facilityIdForCode = useCallback(
    (facilityCode: string | null) => {
      if (!facilityCode) return null;
      const match = facilities.find(
        (f) => f.code.toUpperCase() === facilityCode.toUpperCase(),
      );
      return match?.id ?? null;
    },
    [facilities],
  );

  const loadLocationsForFacility = useCallback(
    async (facilityCode: string | null) => {
      const fid = facilityIdForCode(facilityCode);
      if (!fid) {
        setLocations([]);
        return;
      }
      const res = await listReferenceItems("location", {
        facilityId: fid,
        pageSize: 100,
      });
      setLocations(res.items);
    },
    [facilityIdForCode],
  );

  const appendLog = (row: Omit<SessionLogRow, "id" | "time">) => {
    setSessionLog((prev) => [
      {
        id: newId(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        ...row,
      },
      ...prev,
    ]);
  };

  const applyUpdate = async (
    lookup: AssetLookupResult,
    preset: ScanPreset,
    scannedCode: string,
    ask?: { grade: string; status: string; locationId: string },
  ) => {
    const before = {
      grade: lookup.grade,
      status: lookup.status,
      locationId: lookup.locationId,
    };
    const { body, empty } = buildScanApplyBody(preset, ask);

    if (empty) {
      setFailureMsg("Preset has no fields to apply.");
      playTone(220, 120);
      return;
    }

    const updated = await updateAsset(lookup.id, body);
    setUndo({
      assetId: lookup.id,
      grade: before.grade,
      status: before.status,
      locationId: before.locationId,
    });

    const changes: string[] = [];
    if (body.grade !== undefined)
      changes.push(formatScanFieldChange("grade", before.grade, updated.grade));
    if (body.status !== undefined)
      changes.push(formatScanFieldChange("status", before.status, updated.status));
    if (body.locationId !== undefined)
      changes.push(
        formatScanFieldChange("location", lookup.locationName, updated.locationName),
      );

    const summary = `${updated.aptoId} · ${updated.partNumber ?? "asset"} — ${changes.join(", ")}`;
    setSuccessMsg(summary);
    setFailureMsg(null);
    playTone(880, 80);
    appendLog({
      code: scannedCode,
      aptoId: updated.aptoId,
      fieldsChanged: changes.join(", "),
      result: "Success",
    });
    setCode("");
    focusCode();
  };

  const onScanSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!selectedPreset || busy || !code.trim()) return;

    setBusy(true);
    setSuccessMsg(null);
    setFailureMsg(null);
    setPendingAsk(null);

    const scanned = code.trim();
    try {
      const lookup = await lookupAssetByCode(scanned);
      if (scanPresetNeedsAsk(selectedPreset)) {
        await loadLocationsForFacility(lookup.facilityCode);
        setPendingAsk({ code: scanned, lookup });
        setAskGrade(lookup.grade ?? "");
        setAskStatus(lookup.status ?? "");
        setAskLocationId(lookup.locationId ?? "");
        setBusy(false);
        return;
      }

      await applyUpdate(lookup, selectedPreset, scanned);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Scan failed";
      setFailureMsg(message);
      playTone(220, 120);
      appendLog({
        code: scanned,
        aptoId: "—",
        fieldsChanged: "—",
        result: message.length > 48 ? message.slice(0, 48) + "…" : message,
      });
      setCode("");
      focusCode();
    } finally {
      setBusy(false);
    }
  };

  const onApplyAsk = async () => {
    if (!pendingAsk || !selectedPreset) return;
    setBusy(true);
    try {
      await applyUpdate(pendingAsk.lookup, selectedPreset, pendingAsk.code, {
        grade: askGrade,
        status: askStatus,
        locationId: askLocationId,
      });
      setPendingAsk(null);
      focusCode();
    } catch (err) {
      setFailureMsg(err instanceof Error ? err.message : "Apply failed");
      playTone(220, 120);
      focusCode();
    } finally {
      setBusy(false);
    }
  };

  const onUndo = async () => {
    if (!undo || busy) return;
    setBusy(true);
    try {
      await updateAsset(undo.assetId, buildScanUndoBody(undo));
      appendLog({
        code: "—",
        aptoId: "—",
        fieldsChanged: "Undo · restored prior grade/status/location",
        result: "Success",
      });
      setUndo(null);
      setSuccessMsg("Undo complete — previous values restored.");
      setFailureMsg(null);
      focusCode();
    } catch (err) {
      setFailureMsg(err instanceof Error ? err.message : "Undo failed");
      playTone(220, 120);
    } finally {
      setBusy(false);
    }
  };

  const onSavePreset = (e: FormEvent) => {
    e.preventDefault();
    const name = editorName.trim() || "New preset";
    const preset: ScanPreset = {
      id: selectedPreset?.id && editorOpen ? selectedPreset.id : newId(),
      name,
      isGlobal: editorGlobal,
      createdBy: DEMO_USER,
      fields: editorFields,
    };
    const others = presets.filter((p) => p.id !== preset.id);
    const next = [...others, preset];
    setPresets(next);
    savePresets(next);
    setSelectedPresetId(preset.id);
    setEditorOpen(false);
  };

  const openEditor = () => {
    if (selectedPreset) {
      setEditorName(selectedPreset.name);
      setEditorGlobal(selectedPreset.isGlobal);
      setEditorFields({ ...selectedPreset.fields });
    } else {
      setEditorName("");
      setEditorGlobal(false);
      setEditorFields({
        gradeMode: "ask",
        statusMode: "ask",
        locationMode: "ask",
      });
    }
    setEditorOpen(true);
  };

  const askLocations = pendingAsk
    ? locations
    : locations;

  return (
    <div className="dashboard-stack warehouse-scan-preview-panel" data-testid="f8-scan-page">
      {refError && <AlertBanner message={refError} />}

      <section className="dashboard-panel">
        <h2 className="panel-title">Preset</h2>
        <label className="filter-field" htmlFor="f8-scan-preset-select">
          Active preset
          <select className="aims-select"
            id="f8-scan-preset-select"
            data-testid="f8-scan-preset-select"
            value={selectedPreset?.id ?? ""}
            onChange={(e) => setSelectedPresetId(e.target.value)}
          >
            {visiblePresets.map((p) => (
              <option key={p.id} value={p.id}>{p.name}{p.isGlobal ? " (shared)" : ""}</option>
            ))}
          </select>
        </label>
        <div className="row" style={{ marginTop: "0.75rem" }}>
          <AimsButton type="button" variant="secondary" onClick={openEditor}>
            Edit preset
          </AimsButton>
        </div>

        {editorOpen && (
          <form
            className="grid f8-preset-editor"
            data-testid="f8-scan-preset-editor"
            onSubmit={onSavePreset}
            style={{ marginTop: "1rem" }}
          >
            <label>
              Preset name
              <input value={editorName} onChange={(e) => setEditorName(e.target.value)} />
            </label>
            <label className="filter-check">
              <input
                type="checkbox"
                data-testid="f8-scan-preset-global"
                checked={editorGlobal}
                onChange={(e) => setEditorGlobal(e.target.checked)}
              />
              Global preset (shared on this device)
            </label>
            {(["grade", "status", "location"] as const).map((field) => (
              <div key={field} className="f8-field-row">
                <span className="panel-subtitle">{field}</span>
                <select className="aims-select"
                  value={editorFields[`${field}Mode` as keyof PresetFields] ?? "ask"}
                  onChange={(e) =>
                    setEditorFields((f) => ({
                      ...f,
                      [`${field}Mode`]: e.target.value as FieldMode,
                    }))
                  }
                >
                  <option value="fixed">Fixed</option>
                  <option value="ask">Ask each scan</option>
                </select>
                {editorFields[`${field}Mode` as keyof PresetFields] === "fixed" && field !== "location" && (
                  <select className="aims-select"
                    value={(editorFields[field] as string) ?? ""}
                    onChange={(e) =>
                      setEditorFields((f) => ({ ...f, [field]: e.target.value }))
                    }
                  >
                    <option value="">Select…</option>
                    {(field === "grade" ? grades : statuses).map((item) => (
                      <option key={item.id} value={item.code}>{item.name}</option>
                    ))}
                  </select>
                )}
                {editorFields.locationMode === "fixed" && field === "location" && (
                  <input
                    placeholder="Location id (pick after facility in scan)"
                    value={editorFields.locationId ?? ""}
                    onChange={(e) =>
                      setEditorFields((f) => ({ ...f, locationId: e.target.value }))
                    }
                  />
                )}
              </div>
            ))}
            <AimsButton type="submit" variant="primary">Save preset</AimsButton>
          </form>
        )}
      </section>

      <section
        className="dashboard-panel f8-scan-card"
        aria-busy={busy}
      >
        <form onSubmit={(e) => void onScanSubmit(e)}>
          <label className="f8-code-label" htmlFor="f8-scan-code-input">
            Scan code
            <input
              ref={codeInputRef}
              id="f8-scan-code-input"
              data-testid="f8-scan-code-input"
              className="f8-code-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              aria-label="Scan code"
              disabled={busy}
            />
          </label>
        </form>
        <div className="row f8-scan-actions" style={{ marginTop: "0.75rem" }}>
          <AimsButton
            type="button"
            variant="secondary"
            data-testid="f8-scan-undo"
            disabled={!undo || busy}
            onClick={() => void onUndo()}
            aria-label="Undo last successful scan"
          >
            Undo last scan
          </AimsButton>
          {busy && (
            <p className="muted f8-scan-busy" role="status" aria-live="polite">
              Applying…
            </p>
          )}
        </div>

        {pendingAsk && selectedPreset && (
          <div className="f8-ask-strip" role="region" aria-label="Confirm scan fields">
            {selectedPreset.fields.gradeMode === "ask" && (
              <label>
                Grade
                <select className="aims-select" value={askGrade} onChange={(e) => setAskGrade(e.target.value)}>
                  <option value="">Select…</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.code}>{g.name}</option>
                  ))}
                </select>
              </label>
            )}
            {selectedPreset.fields.statusMode === "ask" && (
              <label>
                Status
                <select className="aims-select" value={askStatus} onChange={(e) => setAskStatus(e.target.value)}>
                  <option value="">Select…</option>
                  {statuses.map((s) => (
                    <option key={s.id} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </label>
            )}
            {selectedPreset.fields.locationMode === "ask" && (
              <label>
                Location
                <select className="aims-select" value={askLocationId} onChange={(e) => setAskLocationId(e.target.value)}>
                  <option value="">Select…</option>
                  {askLocations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </label>
            )}
            <AimsButton
              type="button"
              variant="primary"
              data-testid="f8-scan-apply-ask"
              onClick={() => void onApplyAsk()}
              disabled={busy}
            >
              Apply
            </AimsButton>
          </div>
        )}

        {successMsg && (
          <div
            className="f8-scan-result f8-scan-result--success"
            data-testid="f8-scan-result-success"
            role="status"
            aria-live="polite"
          >
            {successMsg}
          </div>
        )}
        {failureMsg && (
          <div
            className="f8-scan-result f8-scan-result--failure"
            data-testid="f8-scan-result-failure"
            role="status"
            aria-live="polite"
          >
            {failureMsg}
          </div>
        )}
      </section>

      <section className="dashboard-panel">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="panel-title">Session log</h2>
          {sessionLog.length > 0 && (
            <AimsButton
              type="button"
              variant="ghost"
              onClick={() => setSessionLog([])}
              aria-label="Clear session log"
            >
              Clear log
            </AimsButton>
          )}
        </div>
        <div data-testid="f8-scan-session-log">
        <DataTable
          ariaLabel="Scan session log"
          tableTestId="f8-scan-session-log-table"
          rows={sessionLog}
          rowKey={(r) => r.id}
          columns={[
            { id: "time", header: "Time", cell: (r) => r.time },
            { id: "code", header: "Code", cell: (r) => r.code },
            { id: "apto", header: "Apto ID", cell: (r) => r.aptoId },
            { id: "fields", header: "Fields changed", cell: (r) => r.fieldsChanged },
            { id: "result", header: "Result", cell: (r) => r.result },
          ]}
          emptyState={<p className="muted">No scans yet this session.</p>}
        />
        </div>
      </section>
    </div>
  );
}
