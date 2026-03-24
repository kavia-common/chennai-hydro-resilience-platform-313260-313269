import { useEffect, useMemo, useState } from "react";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useModel } from "../../contexts/ModelContext";

type Props = {
  thresholdMm: number;
};

type Point = {
  t: string;
  mm: number;
};

function nowLabel() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * PUBLIC_INTERFACE
 */
export function RainfallLineChart({ thresholdMm }: Props) {
  /** Small line chart to show predicted rainfall history for this session. */
  const { lastFloodPrediction } = useModel();
  const [points, setPoints] = useState<Point[]>([]);

  useEffect(() => {
    if (!lastFloodPrediction) return;
    setPoints((prev) => {
      const next = [...prev, { t: nowLabel(), mm: lastFloodPrediction.predicted_rainfall_mm }];
      return next.slice(-20);
    });
  }, [lastFloodPrediction]);

  const data = useMemo(() => {
    // Provide a subtle placeholder baseline if empty.
    if (points.length > 0) return points;
    return [
      { t: "—", mm: 0 },
      { t: "—", mm: 0 }
    ];
  }, [points]);

  return (
    <div style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 12, bottom: 5, left: 0 }}>
          <XAxis dataKey="t" tick={{ fill: "var(--muted)" }} />
          <YAxis tick={{ fill: "var(--muted)" }} width={44} />
          <Tooltip
            contentStyle={{
              background: "rgba(15, 23, 42, 0.92)",
              border: "1px solid rgba(148, 163, 184, 0.25)",
              borderRadius: 12,
              color: "white"
            }}
            labelStyle={{ color: "rgba(226, 232, 240, 0.9)" }}
          />
          <ReferenceLine y={thresholdMm} stroke="rgba(239, 68, 68, 0.85)" strokeDasharray="6 4" />
          <Line
            type="monotone"
            dataKey="mm"
            stroke="rgba(59, 130, 246, 0.95)"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
