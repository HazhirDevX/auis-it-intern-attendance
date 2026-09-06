import {
  addDays,
  expectedHours,
  monthBounds,
  roundHours,
  type TargetSettings,
} from "@/lib/targets";
import { weekStartString } from "@/lib/dates";
export type DayPoint = {
  date: string;
  hours: number;
  count?: number;
  cumulative?: number;
};
export function aggregateSeries(
  data: DayPoint[],
  period: "daily" | "weekly" | "monthly",
  start: string,
  end: string,
) {
  const buckets = new Map<
    string,
    { date: string; hours: number; count: number }
  >();
  const keyFor = (date: string) =>
    period === "weekly"
      ? weekStartString(date)
      : period === "monthly"
        ? `${date.slice(0, 7)}-01`
        : date;
  for (
    let cursor = start;
    cursor <= end;
    cursor =
      period === "monthly"
        ? addDays(monthBounds(cursor).end, 1)
        : addDays(cursor, period === "weekly" ? 7 : 1)
  ) {
    const key = keyFor(cursor);
    buckets.set(key, { date: key, hours: 0, count: 0 });
  }
  if (end >= start) {
    const key = keyFor(end);
    if (!buckets.has(key)) buckets.set(key, { date: key, hours: 0, count: 0 });
  }
  for (const row of data) {
    if (row.date < start || row.date > end) continue;
    const key = keyFor(row.date);
    const item = buckets.get(key) ?? { date: key, hours: 0, count: 0 };
    item.hours = roundHours(item.hours + row.hours);
    item.count += row.count ?? 0;
    buckets.set(key, item);
  }
  return [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date));
}
export function trajectory(
  data: DayPoint[],
  settings: TargetSettings,
  end: string,
) {
  let cumulative = 0;
  return aggregateSeries(data, "daily", settings.startDate, end).map((row) => ({
    ...row,
    cumulative: (cumulative = roundHours(cumulative + row.hours)),
    expected: expectedHours(settings, row.date),
  }));
}
