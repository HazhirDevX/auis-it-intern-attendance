import { z } from "zod";

import {
  AUIS_EMAIL_DOMAIN,
  EXTERNAL_GOOGLE_EMAIL_ALLOWLIST,
  MAX_DAILY_HOURS,
} from "@/lib/constants";

export const auisEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid AUIS email address."))
  .refine((value) => value.endsWith(`@${AUIS_EMAIL_DOMAIN}`), {
    message: `Email must end with @${AUIS_EMAIL_DOMAIN}.`,
  });

export const activitySchema = z.object({
  workDate: z.iso.date("Choose a valid work date."),
  hours: z.coerce
    .number("Hours must be a number.")
    .positive("Hours must be greater than zero.")
    .max(MAX_DAILY_HOURS, `Hours cannot exceed ${MAX_DAILY_HOURS} per entry.`),
  description: z
    .string()
    .trim()
    .min(3, "Describe the work you completed.")
    .max(1000, "Keep the description under 1,000 characters."),
});

export const activityUpdateSchema = activitySchema.extend({
  id: z.uuid("Invalid activity record."),
});

export const internSchema = z.object({
  name: z.string().trim().min(2, "Enter the intern's full name.").max(160),
  email: auisEmailSchema,
  role: z.enum(["STUDENT", "ADMIN"]).default("STUDENT"),
  semesterId: z
    .union([z.uuid(), z.literal(""), z.literal("none")])
    .transform((value) =>
      value === "none" || value === "" ? undefined : value,
    )
    .optional(),
});

export const semesterSchema = z
  .object({
    name: z.string().trim().min(3, "Enter a semester name.").max(120),
    startDate: z.iso.date("Choose a valid start date."),
    endDate: z.iso.date("Choose a valid end date."),
    targetHours: z.coerce
      .number()
      .positive("Target hours must be greater than zero.")
      .max(1000, "Target hours must be 1,000 or less."),
    activate: z.coerce.boolean().default(false),
    internIds: z.array(z.uuid()).default([]),
  })
  .refine((value) => value.endDate >= value.startDate, {
    path: ["endDate"],
    message: "End date cannot be before the start date.",
  });

export function normalizeAuisEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isAuisEmail(email: string) {
  return auisEmailSchema.safeParse(email).success;
}

export function isAllowedGoogleEmail(email: string) {
  const normalizedEmail = normalizeAuisEmail(email);
  return (
    isAuisEmail(normalizedEmail) ||
    EXTERNAL_GOOGLE_EMAIL_ALLOWLIST.includes(
      normalizedEmail as (typeof EXTERNAL_GOOGLE_EMAIL_ALLOWLIST)[number],
    )
  );
}
