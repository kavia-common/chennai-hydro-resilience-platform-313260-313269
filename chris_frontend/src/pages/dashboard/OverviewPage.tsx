import { useMemo } from "react";

import { useModel } from "../../contexts/ModelContext";
import { GlassCard } from "../../components/ui/GlassCard";
import { RiskMap } from "../../components/map/RiskMap";
import { RainfallLineChart } from "../../components/charts/RainfallLineChart";
import { FloodProbabilityGauge } from "../../components/charts/FloodProbabilityGauge";

/**
 * PUBLIC_INTERFACE
 */
export function OverviewPage() {
  /** Dashboard overview: map + quick KPIs + charts. */
  const { modelInfo, lastFloodPrediction } = useModel();

  const threshold = modelInfo?.model_a?.flood_threshold_mm ?? 420;

  const rainfall = lastFloodPrediction?.predicted_rainfall_mm ?? 0;
  const floodProb = lastFloodPrediction?.flood_probability_pct ?? 0;

  const riskLabel = useMemo(() => {
    if (floodProb >= 60) return { label: "High risk", cls: "error" as const };
    if (floodProb >= 20) return { label: "Moderate risk", cls: "info" as const };
    return { label: "Low risk", cls: "success" as const };
  }, [floodProb]);

  return (
    <div className="dashGrid">
      <div className="gridCol">
        <GlassCard title="Risk Map • Chennai" subtitle="Interactive context map with risk cue overlays">
          <RiskMap floodProbabilityPct={floodProb} />
        </GlassCard>
      </div>

      <div className="gridCol">
        <div className="kpiRow">
          <GlassCard title="Predicted rainfall" subtitle="Next-month rainfall (mm)">
            <div className="kpiValue">
              {rainfall ? rainfall.toFixed(1) : "—"} <span className="kpiUnit">mm</span>
            </div>
            <div className="muted">Threshold reference: {threshold.toFixed(0)} mm</div>
          </GlassCard>

          <GlassCard title="Flood probability" subtitle="Binary proxy (0/100) until calibrated">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div className="kpiValue">{Math.round(floodProb)}%</div>
                <span className={`pill ${riskLabel.cls}`}>{riskLabel.label}</span>
              </div>
              <FloodProbabilityGauge value={floodProb} />
            </div>
          </GlassCard>
        </div>

        <GlassCard title="Rainfall trend (session)" subtitle="History of predictions in this session">
          <RainfallLineChart thresholdMm={threshold} />
          <div className="muted" style={{ marginTop: 8 }}>
            Run a prediction in <b>Model A</b> to populate this chart and map.
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
