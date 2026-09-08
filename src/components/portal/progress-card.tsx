import { progressState, targetMessage } from "@/lib/targets";
export function ProgressCard({
  hours,
  target,
  semesterName,
}: {
  hours: number;
  target: number;
  semesterName: string;
}) {
  const state = progressState(hours, target);
  return (
    <section className="target-rack" aria-label="Semester progress">
      <div className="target-rack-head">
        <h2>🛰️ {semesterName}</h2>
        <span className="font-mono text-[10px]">MISSION TRACKER</span>
      </div>
      <div className="target-lane">
        <h3>Semester target</h3>
        <p className="target-value metric-number">
          {hours.toFixed(1)}
          <span>/ {target} hrs</span>
        </p>
        <div
          className="pixel-meter"
          role="progressbar"
          aria-label="Semester progress"
          aria-valuenow={state.bar}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div style={{ width: `${state.bar}%` }} />
        </div>
        <p className="target-caption">
          {state.percentage.toFixed(1)}% ·{" "}
          {state.excess
            ? `${state.excess.toFixed(1)} hours beyond target`
            : `${state.remaining.toFixed(1)} hours remaining`}
        </p>
        {state.complete && (
          <span className="achievement-badge">🏆 MISSION COMPLETE</span>
        )}
        <p className="target-joke">
          {targetMessage("Semester", hours, target)}
        </p>
      </div>
      <div className="trajectory-strip">
        💾 Remember: describe the fix, not just “fixed stuff”. Future you says
        thanks.
      </div>
    </section>
  );
}
