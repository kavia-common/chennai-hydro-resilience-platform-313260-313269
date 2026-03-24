type Props = {
  value: number; // 0..100
};

function clamp(x: number) {
  return Math.max(0, Math.min(100, x));
}

function colorFor(v: number) {
  if (v >= 60) return "#ef4444";
  if (v >= 20) return "#f59e0b";
  return "#3b82f6";
}

/**
 * PUBLIC_INTERFACE
 */
export function FloodProbabilityGauge({ value }: Props) {
  /** Compact gauge using conic-gradient with a numeric center label. */
  const v = clamp(value);
  const c = colorFor(v);

  const bg = `conic-gradient(${c} ${v}%, rgba(148, 163, 184, 0.25) 0)`;

  return (
    <div className="gauge" aria-label={`Flood probability ${Math.round(v)}%`} title={`${Math.round(v)}%`}>
      <div className="gaugeRing" style={{ background: bg }} />
      <div className="gaugeInner">
        <div className="gaugeValue">{Math.round(v)}%</div>
      </div>
    </div>
  );
}
