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
}: {
  semester: TargetSettings & { name: string };
  metrics: {
    totalHours: number;
    weekHours: number;
    monthHours: number;
    activityCount: number;
  };
  today?: string;
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
      className="progress-workspace overflow-hidden rounded-2xl border bg-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <Terminal aria-hidden className="size-4 text-[#947011]" /> Your
          progress, in sync.
        </h2>
        <span className="text-xs text-muted-foreground">
          {semester.startDate} → {semester.endDate}
        </span>
      </div>
      <div className="grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
        {rows.map((row, index) => {
          const state = progressState(row.hours, row.target);
          return (
            <div
              key={row.label}
              className={`min-w-0 p-5 sm:p-6 ${index === 2 ? "bg-primary text-white" : ""}`}
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
              <p
                className={`mt-1 text-xs ${index === 2 ? "text-slate-300" : "text-muted-foreground"}`}
              >
                {row.detail}
              </p>
              <p className="metric-number mt-6 text-4xl font-semibold">
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
                className={`my-4 h-2 overflow-hidden rounded-full ${index === 2 ? "bg-white/15" : "bg-muted"}`}
              >
                <div
                  className="h-full rounded-full bg-[#c4981b] transition-[width] duration-500"
                  style={{ width: `${state.bar}%` }}
                />
              </div>
              <p
                className={`text-xs ${index === 2 ? "text-slate-300" : "text-muted-foreground"}`}
              >
                {row.target == null
                  ? "No historical target configured"
                  : `${state.percentage.toFixed(1)}% · ${state.excess > 0 ? `${state.excess.toFixed(1)} hrs beyond target` : `${state.remaining.toFixed(1)} hrs remaining`}`}
              </p>
              <p
                className={`mt-4 min-h-10 text-xs leading-relaxed ${index === 2 ? "text-[#e6ce80]" : "text-muted-foreground"}`}
              >
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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-[#faf9f5] px-5 py-3 text-xs sm:px-6">
        <TrendingUp aria-hidden className="size-4" />
        <strong>
          {metrics.totalHours >= semester.targetHours
            ? "Semester complete"
            : Math.abs(delta) < 1
              ? "On pace"
              : delta > 0
                ? "Ahead of pace"
                : "Room to catch up"}
        </strong>
        <span className="text-muted-foreground">
          {expected.toFixed(1)} hrs expected by today ·{" "}
          {Math.abs(delta).toFixed(1)} hrs {delta >= 0 ? "ahead" : "behind"}.
          Targets are prorated at semester boundaries.
        </span>
      </div>
    </section>
  );
}
