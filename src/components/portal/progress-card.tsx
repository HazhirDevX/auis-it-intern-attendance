import { Flag, Rocket } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { progressMessages } from "@/lib/constants";

export function ProgressCard({
  hours,
  target,
  semesterName,
}: {
  hours: number;
  target: number;
  semesterName: string;
}) {
  const percentage = target > 0 ? (hours / target) * 100 : 0;
  const remaining = Math.max(0, target - hours);
  const over = Math.max(0, hours - target);
  const message =
    percentage >= 100
      ? progressMessages.complete
      : percentage >= 80
        ? progressMessages.almost
        : percentage >= 35
          ? progressMessages.steady
          : progressMessages.starting;

  return (
    <Card className="relative overflow-hidden border-[#c4981b]/35 bg-primary text-white shadow-lg shadow-[#0b2545]/10">
      <div className="absolute -right-16 -top-20 size-56 rounded-full bg-[#c4981b]/15 blur-2xl" />
      <CardHeader className="relative flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#dfc66f]">
            {semesterName}
          </p>
          <CardTitle className="mt-1 text-lg text-white">
            Internship progress
          </CardTitle>
        </div>
        <Flag className="size-5 text-[#dfc66f]" />
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-end justify-between gap-4">
          <p className="metric-number text-3xl font-semibold sm:text-4xl">
            {hours.toFixed(1)}{" "}
            <span className="text-lg text-slate-300">/ {target} hrs</span>
          </p>
          <p className="metric-number text-lg font-semibold text-[#efdb96]">
            {percentage.toFixed(1)}%
          </p>
        </div>
        <Progress
          value={Math.min(percentage, 100)}
          className="mt-5 h-2.5 bg-white/15 [&>div]:bg-[#d4ad36]"
          aria-label={`${percentage.toFixed(1)} percent complete`}
        />
        <div className="mt-4 flex flex-col gap-2 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {over > 0
              ? `${over.toFixed(1)} hours beyond target`
              : `${remaining.toFixed(1)} hours remaining`}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Rocket className="size-3.5 text-[#dfc66f]" />
            {message}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
