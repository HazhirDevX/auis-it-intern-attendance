"use client";
import { useState, useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
const subscribe = () => () => {};
export function InternComparisonChart({
  data,
}: {
  data: Array<{
    name: string;
    hours: number;
    targetHours: number;
    activityCount?: number;
  }>;
}) {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [metric, setMetric] = useState<"hours" | "activityCount">("hours");
  return (
    <section className="insights-panel">
      <div className="mb-4 flex flex-wrap justify-between gap-3">
        <h2 className="font-semibold">👥 Intern comparison</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={metric === "hours" ? "default" : "outline"}
            aria-pressed={metric === "hours"}
            onClick={() => setMetric("hours")}
          >
            Hours
          </Button>
          <Button
            size="sm"
            variant={metric === "activityCount" ? "default" : "outline"}
            aria-pressed={metric === "activityCount"}
            onClick={() => setMetric("activityCount")}
          >
            Activities
          </Button>
        </div>
      </div>
      <div
        className="chart-surface"
        style={{ height: Math.max(220, data.length * 45) }}
        role="img"
        aria-label={`Intern ${metric} comparison. Values below.`}
      >
        {hydrated && (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 0, right: 24 }}
            >
              <CartesianGrid
                strokeDasharray="3 5"
                horizontal={false}
                stroke="#dce5df"
              />
              <XAxis
                type="number"
                allowDecimals={metric === "hours"}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip />
              <Bar
                dataKey={metric}
                name={metric === "hours" ? "Hours" : "Activities"}
                fill="#285f66"
                isAnimationActive={false}
                maxBarSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <details className="mt-3 text-xs">
        <summary className="cursor-pointer py-2">View comparison data</summary>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Intern</th>
                <th>Hours</th>
                <th>Activities</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr className="border-t" key={i}>
                  <td className="py-2">{row.name}</td>
                  <td>{row.hours.toFixed(1)}</td>
                  <td>{row.activityCount ?? 0}</td>
                  <td>{row.targetHours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
