# AUIS portal redesign — September 2026

## Product review and decisions

The existing Next.js/Auth.js/Drizzle application remains the foundation. No account, activity, or membership is recreated by the migrations.

| Finding | Change |
| --- | --- |
| Overview label differed from the requested navigation | Dashboard throughout navigation and headings |
| History was an alias of Activities | Dedicated semester timeline with links to scoped records and analytics |
| Oversized semester card and repeated dashboard metrics | One weekly/monthly/semester progress surface; compact trend and recent activity ledger |
| Analytics offered only daily totals and a flat target line | Daily/weekly/monthly grouping, activity counts, date range, zero periods, cumulative expected trajectory, active days and best period |
| Weekly/monthly totals lacked upper date bounds | Explicit Monday–Sunday and calendar-month bounds |
| Admin memberships counted as student interns | Student-only department progress, counts, and department series |
| An admin profile could inherit all activities | Explicit target-user filtering in profile queries |
| Create forms dominated management screens | Existing records first; expandable create and edit settings |
| Audit JSON was clipped and tables awkward on narrow screens | Responsive event timeline with expandable complete snapshots |
| Mobile menu remained open after navigation | Close-on-navigation, scrollable menu, keyboard focus, skip link |
| Early form input could be lost during hydration | Input enabled after hydration; controlled fields preserve failed submissions |
| White favicon surface / generic tab presentation | Transparent official emblem, multi-resolution ICO, PNG and Apple icon |

## Target policy

- Dates are inclusive; reporting dates use Asia/Baghdad.
- Weeks run Monday–Sunday. Months are actual calendar months, including leap February.
- Admins enter weekly and monthly goals. They explicitly choose WEEKLY or MONTHLY as the official total's basis.
- WEEKLY: `weekly hours × inclusive semester days ÷ 7`.
- MONTHLY: sum `monthly hours × included days in each month ÷ calendar days in that month`.
- Calculations retain precision until the final result, rounded to two decimals. Period goals prorate intersection with the semester.
- Weekly/monthly goals can imply different workloads. The form warns when the monthly value differs by more than 10% from weekly × 52 ÷ 12. The explicitly selected basis wins; goals are never added together.
- Existing semesters keep the exact original total and null period targets. No historical weekly/monthly values are invented. Admins can explicitly adopt new settings for active/draft semesters; prior settings are audited. Archived settings remain read-only.
- Actual percentages may exceed 100%; progress bars stop at 100% and excess hours remain visible.
- Expected trajectory is based on the selected calculation basis, or linear daily pacing for legacy totals. It is an informational estimate, not an attendance policy.

## Design and accessibility

AUIS navy/gold, restrained monospace/pixel accents, unified progress panels, light surfaces and modest motion. The pointer background uses a passive listener and requestAnimationFrame without React state updates. It is inactive on touch and disabled for reduced motion. Charts have readable data tables; dialog content is height-bounded and scrollable. The authenticated footer reads “Developed by Hazhir IT-Intern”.

## Data safety and QA

Migrations 0002 and 0003 add nullable target settings and all-or-none constraints. Production baseline before migration: 7 users, 3 activities, 1 semester, 12.00 logged hours. Required administrators were verified active in production: zhir.barzan, karo.omed, and ha23109 at auis.edu.krd.

Integration writes are isolated to Neon branch `redesign-qa-20260906` (`br-wild-dew-a6ju0759`). It is retained for reproducibility, not used by production.

Run QA with PowerShell:

```powershell
$env:QA_DATABASE_HOST='ep-misty-silence-a6cy5xpo.us-west-2.aws.neon.tech'
node scripts/qa.mjs npm run db:migrate
node scripts/qa.mjs npm run test:e2e
```

The runner inherits local credentials but changes only the child process database host to the isolated endpoint; `.env.local` is not rewritten. Protected tests fail closed unless this isolated host is selected. They create encrypted Auth.js test sessions using the test environment secret, exercising real server database roles—not production auth bypasses. These tests do not substitute for a human Google OAuth challenge.

Screenshots are generated under git-ignored `test-results/`. The suite checks Student/Admin sections at 320, 375, 430, 768, 1024, 1280, 1440, and 1920px; browser errors, overflow, refresh, mobile navigation, denied admin claims, three administrators, activity CRUD, target creation, export and reduced motion.

## Deployment

Run `npm run check` and the isolated browser suite before publishing. Apply migrations with Drizzle (direct Neon connection), push main, deploy the linked Vercel project, then verify the production favicon, public protections, authenticated navigation, and retained database counts. Never seed or write QA records into production.
