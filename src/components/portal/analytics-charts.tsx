"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDisplayDate } from "@/lib/dates";

type SeriesPoint = { date: string; hours: number; cumulative: number };

export function AnalyticsCharts({
  data,
  target,
}: {
  data: SeriesPoint[];
  target: number;
}) {
  if (!data.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="grid min-h-72 place-items-center p-8 text-center">
          <div>
            <p className="text-4xl">📊</p>
            <h3 className="mt-4 font-semibold text-primary">
              The charts are waiting for data.
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Log some hours first and your timeline will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((point) => ({
    ...point,
    label: formatDisplayDate(point.date),
    target,
  }));

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Hours over time</CardTitle>
        </CardHeader>
        <CardContent className="h-72 pl-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e5e9ef"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip cursor={{ fill: "#f5f6f8" }} />
              <Bar
                dataKey="hours"
                name="Hours"
                fill="#c4981b"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Cumulative progress</CardTitle>
        </CardHeader>
        <CardContent className="h-72 pl-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0b2545" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0b2545" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e5e9ef"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip />
              <Line
                dataKey="target"
                name="Target"
                stroke="#c4981b"
                strokeDasharray="5 5"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                name="Cumulative hours"
                stroke="#0b2545"
                fill="url(#progressFill)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export function InternComparisonChart({
  data,
}: {
  data: Array<{ name: string; hours: number; targetHours: number }>;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Intern hours comparison</CardTitle>
      </CardHeader>
      <CardContent className="h-80 pl-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 20, right: 24 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="#e5e9ef"
            />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={96}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip />
            <Bar
              dataKey="hours"
              name="Logged hours"
              fill="#0b2545"
              radius={[0, 6, 6, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
