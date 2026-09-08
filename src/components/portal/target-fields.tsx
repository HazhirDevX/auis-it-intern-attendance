"use client";

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateSemesterTarget } from "@/lib/targets";

export function TargetFields({
  initial,
}: {
  initial?: {
    startDate: string;
    endDate: string;
    weeklyTargetHours?: number | null;
    monthlyTargetHours?: number | null;
    targetBasis?: string | null;
  };
}) {
  const prefix = useId();
  const [start, setStart] = useState(initial?.startDate ?? "");
  const [end, setEnd] = useState(initial?.endDate ?? "");
  const [weekly, setWeekly] = useState(
    String(initial?.weeklyTargetHours ?? 10),
  );
  const [monthly, setMonthly] = useState(
    String(initial?.monthlyTargetHours ?? 43.33),
  );
  const [basis, setBasis] = useState<"WEEKLY" | "MONTHLY">(
    initial?.targetBasis === "MONTHLY" ? "MONTHLY" : "WEEKLY",
  );
  const valid =
    /^\d{4}-\d{2}-\d{2}$/.test(start) &&
    /^\d{4}-\d{2}-\d{2}$/.test(end) &&
    end >= start &&
    Number(end.slice(0, 4)) - Number(start.slice(0, 4)) <= 2;
  const total = valid
    ? calculateSemesterTarget(
        start,
        end,
        Number(weekly),
        Number(monthly),
        basis,
      )
    : null;
  const mismatch =
    Number(weekly) > 0 &&
    Math.abs(Number(monthly) - (Number(weekly) * 52) / 12) >
      ((Number(weekly) * 52) / 12) * 0.1;
  return (
    <fieldset className="target-fields space-y-4 sm:col-span-2 xl:col-span-4">
      <legend className="mb-3 text-sm font-semibold">
        Dates & hour targets
      </legend>
      <div className="target-fields-grid">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-semester-start`}>Start date</Label>
          <Input
            id={`${prefix}-semester-start`}
            name="startDate"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-semester-end`}>End date</Label>
          <Input
            id={`${prefix}-semester-end`}
            name="endDate"
            type="date"
            min={start}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-weekly-target`}>
            Weekly target (hours)
          </Label>
          <Input
            id={`${prefix}-weekly-target`}
            name="weeklyTargetHours"
            type="number"
            min="0.01"
            max="84"
            step="0.01"
            value={weekly}
            onChange={(e) => setWeekly(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-monthly-target`}>
            Monthly target (hours)
          </Label>
          <Input
            id={`${prefix}-monthly-target`}
            name="monthlyTargetHours"
            type="number"
            min="0.01"
            max="372"
            step="0.01"
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="target-rule grid gap-4 rounded-xl border border-[#c4981b]/30 bg-[#fffaf0] p-4">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-target-basis`}>
            Calculate the official semester total from
          </Label>
          <select
            id={`${prefix}-target-basis`}
            name="targetBasis"
            value={basis}
            onChange={(e) => setBasis(e.target.value as "WEEKLY" | "MONTHLY")}
            className="h-11 w-full rounded-lg border bg-white px-3 text-sm"
          >
            <option value="WEEKLY">Weekly target × semester days ÷ 7</option>
            <option value="MONTHLY">
              Monthly target × calendar-month fractions
            </option>
          </select>
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Both targets guide progress. Only the selected basis determines the
            official total. Dates are inclusive; weeks run Monday–Sunday in
            Baghdad. Partial weeks and months are prorated by their actual days.
          </p>
        </div>
        <div className="self-center">
          <p className="text-xs font-medium uppercase tracking-wider">
            Calculated semester target
          </p>
          <output
            className="metric-number text-3xl font-semibold text-primary"
            aria-live="polite"
          >
            {total == null ? "—" : total.toFixed(2)}{" "}
            <span className="text-sm">hrs</span>
          </output>
        </div>
      </div>
      {mismatch && (
        <p role="status" className="text-sm text-amber-800">
          These targets imply different workloads: {weekly} hours/week is
          approximately {((Number(weekly) * 52) / 12).toFixed(1)} hours/month.
          Check your values; the selected calculation basis wins.
        </p>
      )}
    </fieldset>
  );
}
