export const AUIS_EMAIL_DOMAIN = "auis.edu.krd";
export const EXTERNAL_GOOGLE_EMAIL_ALLOWLIST = [
  "hazhir.a.2004@gmail.com",
] as const;
export const INITIAL_AUTHORIZED_USERS = [
  {
    name: "Zhir Barzan",
    email: "zhir.barzan@auis.edu.krd",
    role: "ADMIN",
  },
  {
    name: "Karo Omed",
    email: "karo.omed@auis.edu.krd",
    role: "ADMIN",
  },
  {
    name: "Hazhir Aso",
    email: "ha23109@auis.edu.krd",
    role: "ADMIN",
  },
  { name: "LK 24117", email: "lk24117@auis.edu.krd", role: "STUDENT" },
  { name: "DD 23103", email: "dd23103@auis.edu.krd", role: "STUDENT" },
  {
    name: "Hazhir Aso",
    email: "hazhir.a.2004@auis.edu.krd",
    role: "STUDENT",
  },
  {
    name: "Hazhir Aso",
    email: "hazhir.a.2004@gmail.com",
    role: "STUDENT",
  },
] as const;
export const APP_TIME_ZONE = "Asia/Baghdad";
export const MAX_DAILY_HOURS = 12;
export const DEFAULT_PAGE_SIZE = 50;

export const APP_NAME = "AUIS IT Intern Portal";

export const progressMessages = {
  complete: "🎉 Internship mission accomplished. The servers salute you.",
  almost: "🚀 Final stretch. Your target is within deploy range.",
  steady: "💻 Strong progress. Keep the activity timeline moving.",
  starting: "☕ Code. Coffee. Internship. Repeat.",
};
