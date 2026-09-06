import { weekStartString } from "@/lib/dates";

const DAY = 86_400_000;
const utc = (date: string) => new Date(`${date}T00:00:00Z`);
export const roundHours = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
export function addDays(date: string, days: number) {
  return new Date(utc(date).getTime() + days * DAY).toISOString().slice(0, 10);
}
export function inclusiveDays(start: string, end: string) {
  return Math.max(
    0,
    Math.round((utc(end).getTime() - utc(start).getTime()) / DAY) + 1,
  );
}
export function monthBounds(date: string) {
  const start = `${date.slice(0, 7)}-01`;
  const next = utc(start);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return { start, end: addDays(next.toISOString().slice(0, 10), -1) };
}
export type TargetSettings = {
  startDate: string;
  endDate: string;
  targetHours: number;
  weeklyTargetHours?: number | null;
  monthlyTargetHours?: number | null;
  targetBasis?: "WEEKLY" | "MONTHLY" | null;
};
export function calculateSemesterTarget(
  start: string,
  end: string,
  weekly: number,
  monthly: number,
  basis: "WEEKLY" | "MONTHLY",
) {
  if (end < start) return 0;
  if (basis === "WEEKLY")
    return roundHours((inclusiveDays(start, end) / 7) * weekly);
  let total = 0;
  for (let cursor = start; cursor <= end;) {
    const month = monthBounds(cursor);
    const stop = month.end < end ? month.end : end;
    total +=
      (monthly * inclusiveDays(cursor, stop)) /
      inclusiveDays(month.start, month.end);
    cursor = addDays(stop, 1);
  }
  return roundHours(total);
}
export function periodTargets(settings: TargetSettings, today: string) {
  const week = {
    start: weekStartString(today),
    end: addDays(weekStartString(today), 6),
  };
  const month = monthBounds(today);
  const clipped = (
    period: { start: string; end: string },
    rate: number | null | undefined,
  ) =>
    rate == null
      ? null
      : roundHours(
          (rate *
            inclusiveDays(
              period.start > settings.startDate
                ? period.start
                : settings.startDate,
              period.end < settings.endDate ? period.end : settings.endDate,
            )) /
            inclusiveDays(period.start, period.end),
        );
  return {
    week: { ...week, target: clipped(week, settings.weeklyTargetHours) },
    month: { ...month, target: clipped(month, settings.monthlyTargetHours) },
  };
}
export function expectedHours(settings: TargetSettings, today: string) {
  if (today < settings.startDate) return 0;
  if (today >= settings.endDate) return settings.targetHours;
  if (
    settings.targetBasis &&
    settings.weeklyTargetHours != null &&
    settings.monthlyTargetHours != null
  ) {
    return Math.min(
      settings.targetHours,
      calculateSemesterTarget(
        settings.startDate,
        today,
        settings.weeklyTargetHours,
        settings.monthlyTargetHours,
        settings.targetBasis,
      ),
    );
  }
  return roundHours(
    (settings.targetHours * inclusiveDays(settings.startDate, today)) /
      inclusiveDays(settings.startDate, settings.endDate),
  );
}
export function progressState(hours: number, target: number | null) {
  const percentage = target != null && target > 0 ? (hours / target) * 100 : 0;
  return {
    percentage,
    bar: Math.min(100, Math.max(0, percentage)),
    remaining: Math.max(0, (target ?? 0) - hours),
    excess: Math.max(0, hours - (target ?? 0)),
    complete: target != null && target > 0 && hours >= target,
  };
}
export function targetMessage(
  period: string,
  hours: number,
  target: number | null,
  seed = 0,
) {
  if (target == null)
    return "Historical target not configured. Your hours still count.";
  if (target === 0)
    return "This period is outside the semester. Catch you next cycle.";
  const percent = hours / target;
  const pools =
    percent > 1
      ? [
          `${period} target exceeded. Apparently, you came with extra RAM.`,
          `${roundHours(hours - target)} hours beyond target. Overachiever mode: enabled.`,
        ]
      : percent >= 1
        ? [
            `${target} hours, logged. ${period} mission compiled successfully.`,
            `${period} target reached. Even the servers are impressed.`,
          ]
        : percent >= 0.8
          ? [
              `Only ${roundHours(target - hours)} hours to go. Final stretch, no loading screen.`,
              "Almost there. One good session can move the needle.",
            ]
          : percent >= 0.5
            ? [
                "Halfway is a milestone, not a parking spot.",
                "Solid progress. Keep shipping the small wins.",
              ]
            : [
                "Your next small win starts with one activity.",
                "Progress is saved one session at a time.",
              ];
  return pools[Math.abs(seed) % pools.length];
}
