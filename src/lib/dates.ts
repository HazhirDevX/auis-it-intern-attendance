import { APP_TIME_ZONE } from "@/lib/constants";

export function localDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatDisplayDate(value: string | Date) {
  const date =
    typeof value === "string" ? new Date(`${value}T12:00:00Z`) : value;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDisplayDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export function weekStartString(today = localDateString()) {
  const midday = new Date(`${today}T12:00:00Z`);
  const day = midday.getUTCDay();
  const distance = day === 0 ? 6 : day - 1;
  midday.setUTCDate(midday.getUTCDate() - distance);
  return midday.toISOString().slice(0, 10);
}
