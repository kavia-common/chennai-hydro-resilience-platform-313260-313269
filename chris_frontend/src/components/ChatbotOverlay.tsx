import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useModel } from "../contexts/ModelContext";

function riskSummary(pct: number) {
  if (pct >= 60) return "High risk: prepare for proactive mitigation and monitoring.";
  if (pct >= 20) return "Moderate risk: watch conditions and validate local alerts.";
  return "Low risk: continue routine monitoring.";
}

/**
 * PUBLIC_INTERFACE
 */
export function ChatbotOverlay() {
  /** A lightweight “explainability” overlay. (No backend chatbot dependency.) */
  const { lastFloodPrediction } = useModel();
  const [open, setOpen] = useState(false);

  const message = useMemo(() => {
    if (!lastFloodPrediction) {
      return "Run a Model A prediction to get an explanation of rainfall and risk.";
    }
    const mm = lastFloodPrediction.predicted_rainfall_mm;
    const pct = lastFloodPrediction.flood_probability_pct;
    return `Predicted rainfall: ${mm.toFixed(1)} mm. Flood probability: ${Math.round(pct)}%. ${riskSummary(pct)}`;
  }, [lastFloodPrediction]);

  return (
    <div className="chatbot">
      <button className="chatFab" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Assistant">
        {open ? "Close" : "Ask"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="chatPanel glassCard"
            initial={{ opacity: 0, y: 12, scale: 0.98, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 12, scale: 0.98, filter: "blur(6px)" }}
            transition={{ duration: 0.25 }}
          >
            <div className="cardTitle">Assistant</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Explanation
            </div>
            <div className="chatMsg">{message}</div>

            <div className="chatQuick">
              <div className="muted" style={{ fontSize: 12 }}>
                Quick prompts
              </div>
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <span className="pill neutral">What does flood probability mean?</span>
                <span className="pill neutral">How to interpret rainfall (mm)?</span>
                <span className="pill neutral">What should I do next?</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
