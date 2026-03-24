import { GlassCard } from "../../components/ui/GlassCard";
import { ModelAForm } from "../../components/modelA/ModelAForm";

/**
 * PUBLIC_INTERFACE
 */
export function ModelAPage() {
  /** Model A input and prediction page. */
  return (
    <div className="stack" style={{ gap: 14 }}>
      <GlassCard
        title="Model A • Flood Risk Prediction"
        subtitle="Enter a sequence window of climate indices + month; get next-month rainfall and flood probability."
      >
        <ModelAForm />
      </GlassCard>
    </div>
  );
}
