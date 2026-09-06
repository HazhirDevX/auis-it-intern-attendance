"use client";
import { useId, useState, useSyncExternalStore } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { aggregateSeries, trajectory, type DayPoint } from "@/lib/analytics";
import { type TargetSettings } from "@/lib/targets";
import { Button } from "@/components/ui/button";

const subscribe = () => () => {};
export function InsightsWorkspace({
  data,
  semester,
  today,
  compact = false,
}: {
  data: DayPoint[];
  semester: TargetSettings;
  today: string;
  compact?: boolean;
}) {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">(
    "weekly",
  );
  const [measure, setMeasure] = useState<"hours" | "count">("hours");
  const [from, setFrom] = useState(semester.startDate);
  const [to, setTo] = useState(
    today < semester.endDate ? today : semester.endDate,
  );
  const id = useId().replaceAll(":", "");
  const start = from >= semester.startDate ? from : semester.startDate;
  const end = to <= semester.endDate ? to : semester.endDate;
  const rows = aggregateSeries(data, period, start, end);
  const cumulative = trajectory(data, semester, end);
  const activeDays = data.filter(
    (row) => row.date >= start && row.date <= end && row.hours > 0,
  ).length;
  const total = rows.reduce((sum, row) => sum + row.hours, 0);
  const count = rows.reduce((sum, row) => sum + row.count, 0);
  const best = [...rows].sort((a, b) => b.hours - a.hours)[0];
  const chart = (running: boolean) => (
    <div
      className="h-64 w-full min-w-0 sm:h-72"
      role="img"
      aria-label={
        running
          ? "Cumulative hours compared with expected progress. Exact values are in chart data below."
          : `${period} ${measure}. Exact values are in chart data below.`
      }
    >
      {hydrated ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ComposedChart
            data={running ? cumulative : rows}
            margin={{ top: 12, right: 12, left: -20, bottom: 4 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="#e5e9ef"
              strokeDasharray="3 5"
            />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => String(v).slice(5)}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              minTickGap={35}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              allowDecimals={running || measure === "hours"}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #dfe4ea",
                fontSize: 12,
              }}
            />
            {running ? (
              <>
                <Area
                  isAnimationActive={false}
                  dataKey="cumulative"
                  name="Logged hours"
                  fill="#0b254510"
                  stroke="#0b2545"
                  strokeWidth={2}
                />
                <Line
                  isAnimationActive={false}
                  dataKey="expected"
                  name="Expected hours"
                  stroke="#b48a1b"
                  strokeDasharray="5 4"
                  dot={false}
                />
              </>
            ) : (
              <Bar
                isAnimationActive={false}
                dataKey={measure}
                name={measure === "hours" ? "Hours" : "Activities logged"}
                fill={measure === "hours" ? "#c4981b" : "#2f6b7a"}
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <div className="grid h-full place-items-center text-xs text-muted-foreground">
          Preparing your activity timeline…
        </div>
      )}
    </div>
  );
  return (
    <section
      className="mt-6 min-w-0 rounded-2xl border bg-white p-5 sm:p-6"
      aria-label="Activity insights"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#8a6a11]">
            {compact ? "A little momentum" : "Explore your data"}
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {compact ? "Your weekly rhythm" : "Activity & progress trends"}
          </h2>
        </div>
        {!compact && (
          <div className="flex flex-wrap gap-1" aria-label="Chart grouping">
            {(["daily", "weekly", "monthly"] as const).map((value) => (
              <Button
                key={value}
                size="sm"
                variant={value === period ? "default" : "ghost"}
                aria-pressed={value === period}
                onClick={() => setPeriod(value)}
              >
                {value[0].toUpperCase() + value.slice(1)}
              </Button>
            ))}
          </div>
        )}
      </div>
      {!compact && (
        <div className="mb-5 flex flex-wrap items-end gap-3 border-b pb-4">
          <label className="text-xs" htmlFor={`${id}from`}>
            From
            <input
              id={`${id}from`}
              aria-label="Chart from date"
              className="mt-1 block max-w-full rounded-lg border p-2 text-sm"
              type="date"
              min={semester.startDate}
              max={semester.endDate}
              value={from}
              onChange={(e) => e.target.value && setFrom(e.target.value)}
            />
          </label>
          <label className="text-xs" htmlFor={`${id}to`}>
            To
            <input
              id={`${id}to`}
              aria-label="Chart to date"
              className="mt-1 block max-w-full rounded-lg border p-2 text-sm"
              type="date"
              min={from}
              max={semester.endDate}
              value={to}
              onChange={(e) => e.target.value && setTo(e.target.value)}
            />
          </label>
          <Button
            variant={measure === "hours" ? "default" : "outline"}
            aria-pressed={measure === "hours"}
            onClick={() => setMeasure("hours")}
          >
            Hours
          </Button>
          <Button
            variant={measure === "count" ? "default" : "outline"}
            aria-pressed={measure === "count"}
            onClick={() => setMeasure("count")}
          >
            Activities logged
          </Button>
        </div>
      )}
      <div className={`grid min-w-0 gap-8 ${!compact ? "xl:grid-cols-2" : ""}`}>
        <div className="min-w-0">
          {!data.length && (
            <p className="mb-2 text-sm text-muted-foreground">
              Your chart is in standby. Log your first activity to bring it
              online.
            </p>
          )}
          {chart(false)}
        </div>
        {!compact && (
          <div className="min-w-0">
            <h3 className="mb-2 text-sm font-medium">
              Cumulative hours vs expected trajectory
            </h3>
            {chart(true)}
            <p className="text-xs text-muted-foreground">
              Navy: logged · Gold dashed: expected · Cumulative totals start at
              the semester start.
            </p>
          </div>
        )}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 border-t pt-4 text-xs sm:grid-cols-4">
        <div className="text-muted-foreground">
          Activities logged
          <strong className="mt-1 block text-lg text-primary">{count}</strong>
        </div>
        <div className="text-muted-foreground">
          Average activity
          <strong className="mt-1 block text-lg text-primary">
            {(count ? total / count : 0).toFixed(1)} hrs
          </strong>
        </div>
        <div className="text-muted-foreground">
          Active days
          <strong className="mt-1 block text-lg text-primary">
            {activeDays}
          </strong>
        </div>
        <div className="text-muted-foreground">
          Best{" "}
          {period === "weekly"
            ? "week"
            : period === "monthly"
              ? "month"
              : "day"}
          <strong className="mt-1 block text-lg text-primary">
            {best?.hours.toFixed(1) ?? "0.0"} hrs
          </strong>
          <span>
            {best && best.hours > 0 ? best.date : "Waiting for a first win"}
          </span>
        </div>
      </div>
      <details className="mt-4 text-xs">
        <summary className="cursor-pointer py-2 text-muted-foreground">
          View accessible chart data
        </summary>
        <div className="max-h-60 overflow-auto">
          <table className="w-full text-left">
            <caption className="sr-only">{period} hours and activities</caption>
            <thead>
              <tr>
                <th className="p-2">Period starts</th>
                <th>Hours</th>
                <th>Activities</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.date} className="border-t">
                  <td className="p-2">{row.date}</td>
                  <td>{row.hours.toFixed(2)}</td>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
