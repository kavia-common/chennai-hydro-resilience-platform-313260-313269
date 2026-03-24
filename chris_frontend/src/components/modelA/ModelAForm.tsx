import { useEffect, useMemo, useState } from "react";
import type { FloodRiskRequest, FloodRiskStep } from "../../lib/api";
import { predictFloodRisk } from "../../lib/api";
import { useModel } from "../../contexts/ModelContext";
import { useToasts } from "../../contexts/ToastContext";

function monthNow() {
  return new Date().getMonth() + 1; // 1..12
}

function clampMonth(m: number) {
  if (!Number.isFinite(m)) return 1;
  return Math.max(1, Math.min(12, Math.round(m)));
}

function buildSampleSequence(seqLen: number): FloodRiskStep[] {
  const baseMonth = monthNow();
  return Array.from({ length: seqLen }).map((_, i) => {
    // Oldest first; month cycles.
    const idx = i - (seqLen - 1);
    const month = clampMonth(baseMonth + idx);

    const t = i / Math.max(1, seqLen - 1);
    // Plausible climate index ranges (not authoritative; for demo UX).
    const ONI = Math.sin(t * Math.PI * 2) * 1.2;
    const DMI = Math.cos(t * Math.PI * 1.8) * 0.6;
    const Nino34_ERSST = Math.sin(t * Math.PI * 2.2) * 1.4;
    const BEST_ENSO = Math.sin(t * Math.PI * 1.6 + 0.4) * 1.0;

    return {
      ONI: Number(ONI.toFixed(3)),
      DMI: Number(DMI.toFixed(3)),
      Nino34_ERSST: Number(Nino34_ERSST.toFixed(3)),
      BEST_ENSO: Number(BEST_ENSO.toFixed(3)),
      month
    };
  });
}

function normalizeNumber(x: string) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

/**
 * PUBLIC_INTERFACE
 */
export function ModelAForm() {
  /** Model A request builder + predictor. */
  const { modelInfo, setLastFloodPrediction } = useModel();
  const { pushToast } = useToasts();

  const seqLen = modelInfo?.model_a?.seq_len ?? 24;
  const features = modelInfo?.model_a?.features ?? ["ONI", "DMI", "Nino34_ERSST", "BEST_ENSO", "month"];

  const [sequence, setSequence] = useState<FloodRiskStep[]>(() => buildSampleSequence(seqLen));
  const [busy, setBusy] = useState(false);

  // Keep sequence length aligned to backend model info.
  useEffect(() => {
    setSequence((prev) => {
      if (prev.length === seqLen) return prev;
      return buildSampleSequence(seqLen);
    });
  }, [seqLen]);

  const onChange = (idx: number, key: keyof FloodRiskStep, value: string) => {
    setSequence((prev) => {
      const next = [...prev];
      const cur = { ...next[idx] };
      if (key === "month") cur.month = clampMonth(normalizeNumber(value));
      else cur[key] = normalizeNumber(value) as never;
      next[idx] = cur;
      return next;
    });
  };

  const useSample = () => {
    setSequence(buildSampleSequence(seqLen));
    pushToast({ variant: "info", title: "Sample loaded", message: `Filled ${seqLen} steps with plausible values.` });
  };

  const autoMonths = () => {
    const base = monthNow();
    setSequence((prev) =>
      prev.map((s, i) => {
        const idx = i - (seqLen - 1);
        return { ...s, month: clampMonth(base + idx) };
      })
    );
    pushToast({ variant: "info", title: "Months auto-filled", message: "Set months relative to the current month." });
  };

  const predict = async () => {
    const req: FloodRiskRequest = { sequence };
    setBusy(true);
    const res = await predictFloodRisk(req);
    if (res.ok) {
      setLastFloodPrediction(res.data);
      pushToast({
        variant: "success",
        title: "Prediction complete",
        message: `${res.data.predicted_rainfall_mm.toFixed(1)} mm • ${Math.round(res.data.flood_probability_pct)}%`
      });
    } else {
      pushToast({ variant: "error", title: "Prediction failed", message: res.error });
    }
    setBusy(false);
  };

  const featureNote = useMemo(() => {
    return `Features: ${features.join(", ")}`;
  }, [features]);

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div className="muted">{featureNote}</div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <button className="btn tiny ghost" onClick={autoMonths} type="button">
            Auto months
          </button>
          <button className="btn tiny ghost" onClick={useSample} type="button">
            Use sample
          </button>
          <button className="btn tiny primary" onClick={predict} type="button" disabled={busy}>
            {busy ? "Predicting…" : "Predict flood risk"}
          </button>
        </div>
      </div>

      <div className="tableWrap">
        <table className="table" aria-label="Model A input sequence table">
          <thead>
            <tr>
              <th>#</th>
              <th>ONI</th>
              <th>DMI</th>
              <th>Nino34_ERSST</th>
              <th>BEST_ENSO</th>
              <th>Month</th>
            </tr>
          </thead>
          <tbody>
            {sequence.map((step, i) => (
              <tr key={i}>
                <td className="muted">{i + 1}</td>
                <td>
                  <input className="input sm" value={step.ONI} onChange={(e) => onChange(i, "ONI", e.target.value)} />
                </td>
                <td>
                  <input className="input sm" value={step.DMI} onChange={(e) => onChange(i, "DMI", e.target.value)} />
                </td>
                <td>
                  <input
                    className="input sm"
                    value={step.Nino34_ERSST}
                    onChange={(e) => onChange(i, "Nino34_ERSST", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="input sm"
                    value={step.BEST_ENSO}
                    onChange={(e) => onChange(i, "BEST_ENSO", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="input sm"
                    value={step.month}
                    onChange={(e) => onChange(i, "month", e.target.value)}
                    inputMode="numeric"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="callout info">
        Tip: If the backend returns “Model A not configured/loaded”, it means the ONNX/scaler artifacts aren’t available yet.
        The UI is ready and will work automatically once the backend model is configured.
      </div>
    </div>
  );
}
