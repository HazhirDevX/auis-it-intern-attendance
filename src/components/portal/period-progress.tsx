import { Check, Terminal, TrendingUp } from "lucide-react";
import { localDateString } from "@/lib/dates";
import {
  expectedHours,
  periodTargets,
  progressState,
  targetMessage,
  type TargetSettings,
} from "@/lib/targets";

export function PeriodProgress({
  semester,
  metrics,
  today = localDateString(),
  compact = false,
}: {
  semester: TargetSettings & { name: string };
  metrics: {
    totalHours: number;
    weekHours: number;
    monthHours: number;
    activityCount: number;
  };
  today?: string;
  compact?: boolean;
}) {
  const periods = periodTargets(semester, today);
  const expected = expectedHours(semester, today);
  const delta = metrics.totalHours - expected;
  const rows = [
    {
      label: "This week",
      detail: "Monday–Sunday",
      hours: metrics.weekHours,
      target: periods.week.target,
    },
    {
      label: "This month",
      detail: new Intl.DateTimeFormat("en", {
        month: "long",
        timeZone: "UTC",
      }).format(new Date(`${today}T12:00:00Z`)),
      hours: metrics.monthHours,
      target: periods.month.target,
    },
    {
      label: "Semester",
      detail: semester.name,
      hours: metrics.totalHours,
      target: semester.targetHours,
    },
  ];
  return (
    <section
      aria-label="Your hour targets"
      className={`target-rack ${compact ? "target-rack-compact" : ""}`}
    >
      <div className="target-rack-head">
        <h2 className="flex items-center gap-2 font-semibold">
          <Terminal aria-hidden className="size-4 text-[#947011]" /> Your
          mission progress
        </h2>
        <span className="text-xs text-slate-300">
          {semester.startDate} → {semester.endDate}
        </span>
      </div>
      <div className="target-lanes">
        {rows.map((row, index) => {
          const state = progressState(row.hours, row.target);
          return (
            <div
              key={row.label}
              className={`target-lane ${state.complete ? "target-complete" : ""}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">{row.label}</h3>
                {state.complete && (
                  <Check
                    aria-label="Target completed"
                    className="size-4 text-emerald-500"
                  />
                )}
              </div>
              <p className="target-detail">{row.detail}</p>
              <p className="metric-number target-value">
                {row.hours.toFixed(1)}
                <span
                  className={`ml-1 text-sm font-normal ${index === 2 ? "text-slate-300" : "text-muted-foreground"}`}
                >
                  / {row.target == null ? "—" : row.target.toFixed(1)} hrs
                </span>
              </p>
              <div
                role="progressbar"
                aria-label={`${row.label} hours`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={state.bar}
                aria-valuetext={
                  row.target == null
                    ? `${row.hours} hours; target not configured`
                    : `${state.percentage.toFixed(1)} percent, ${row.hours} of ${row.target} hours`
                }
                className="pixel-meter"
              >
                <div
                  className="pixel-meter-fill"
                  style={{ width: `${state.bar}%` }}
                />
              </div>
              <p className="target-caption">
                {row.target == null
                  ? "Period goal not configured"
                  : `${state.percentage.toFixed(1)}% · ${state.excess > 0 ? `${state.excess.toFixed(1)} hrs beyond target` : `${state.remaining.toFixed(1)} hrs remaining`}`}
              </p>
              {state.complete && (
                <span className="achievement-badge">
                  🏆{" "}
                  {state.excess > 0 ? "OVERACHIEVER MODE" : "MISSION COMPLETE"}
                </span>
              )}
              <p className="target-joke">
                {targetMessage(
                  row.label,
                  row.hours,
                  row.target,
                  metrics.activityCount + index,
                )}
              </p>
            </div>
          );
        })}
      </div>
      <div className="trajectory-strip">
        <TrendingUp aria-hidden className="size-4" />
        <strong>
          {metrics.totalHours >= semester.targetHours
            ? "🏆 Semester complete"
            : Math.abs(delta) < 1
              ? "✅ On track"
              : delta > 0
                ? "🚀 Ahead"
                : "⚠️ Behind"}
        </strong>
        <span>
          {expected.toFixed(1)} hrs expected by today ·{" "}
          {Math.abs(delta).toFixed(1)} hrs {delta >= 0 ? "ahead" : "behind"}.
          Targets are prorated at semester boundaries.
        </span>
      </div>
    </section>
  );
}
