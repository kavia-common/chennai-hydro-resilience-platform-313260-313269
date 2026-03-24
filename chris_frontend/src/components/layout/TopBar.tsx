import { useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useModel } from "../../contexts/ModelContext";

function formatPct(p: number) {
  const v = Math.max(0, Math.min(100, p));
  return `${Math.round(v)}%`;
}

/**
 * PUBLIC_INTERFACE
 */
export function TopBar() {
  /** Header bar for dashboard pages. */
  const { user, configured } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { modelInfo, modelInfoLoading, lastFloodPrediction } = useModel();

  const modelAStatus = useMemo(() => {
    if (modelInfoLoading) return { label: "Loading model info…", variant: "info" as const };
    if (!modelInfo?.model_a) return { label: "Model A not loaded", variant: "error" as const };
    return { label: `Model A ready (seq_len: ${modelInfo.model_a.seq_len})`, variant: "success" as const };
  }, [modelInfo, modelInfoLoading]);

  return (
    <header className="topbar">
      <div className="row" style={{ gap: 10 }}>
        <span className={`pill ${modelAStatus.variant}`}>{modelAStatus.label}</span>

        {lastFloodPrediction && (
          <span className="pill info">
            Last run: {lastFloodPrediction.predicted_rainfall_mm.toFixed(1)} mm •{" "}
            {formatPct(lastFloodPrediction.flood_probability_pct)}
          </span>
        )}
      </div>

      <div className="row" style={{ gap: 10 }}>
        <button className="btn tiny ghost" onClick={toggleTheme} type="button">
          Theme: {theme}
        </button>

        {configured && user?.email && (
          <span className="pill neutral">{user.email}</span>
        )}
        {!configured && <span className="pill neutral">Demo mode</span>}
      </div>
    </header>
  );
}
