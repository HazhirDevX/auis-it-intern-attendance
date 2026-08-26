# AUIS IT Intern Attendance Portal

A secure, semester-aware attendance and activity system for the AUIS IT Department. Interns log their own work, track progress, and review history; administrators manage access, semesters, department analytics, audit events, and formatted Excel exports.

> Production status: the application, Neon schema, migrations, seed, and automated checks are ready. Google login becomes operational after the department supplies and configures the Google OAuth client described below.

- Production: <https://auis-it-intern-attendance.vercel.app>
- Source: <https://github.com/HazhirDevX/auis-it-intern-attendance>

## Highlights

- Two-gate Google authentication: verified `@auis.edu.krd` account **and** an active authorized-user database record
- Server-enforced `STUDENT` and `ADMIN` permissions on every mutation and protected export
- Semester membership model that starts a new period at zero while retaining all prior activity
- Student logging, editing, confirmed deletion, analytics, progress, pagination, and semester history
- Admin intern access/assignment, profiles, comparative analytics, semester lifecycle, and audit history
- Real `.xlsx` export with styled **Activities** and **Intern Summary** worksheets
- Responsive AUIS navy/gold interface with desktop sidebar, mobile drawer, loading/empty/error states, and accessible Radix UI controls
- Neon PostgreSQL constraints, foreign keys, unique indexes, and query indexes

## Screenshots

Add production screenshots to `docs/screenshots/` after OAuth acceptance testing:

- `login.png`
- `student-dashboard.png`
- `admin-dashboard.png`
- `mobile-log-hours.png`

## Technology

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4 and shadcn/Radix UI
- Auth.js v5 with Google OAuth
- Neon PostgreSQL and Drizzle ORM
- Recharts and ExcelJS
- Zod, Vitest, Playwright, ESLint
- Vercel and GitHub

## Architecture

```text
Browser
   │
   ▼
Next.js App Router
   ├── Auth.js Google OAuth ── verified AUIS domain
   ├── Server DAL ──────────── active authorized user + role
   ├── Server Actions ──────── Zod + ownership/admin checks
   └── Route Handlers ──────── protected Excel export
           │
           ▼
      Neon PostgreSQL
      users ── semester_memberships ── semesters
        └──────── activities ──────────┘
                     └── audit_logs
```

The browser never chooses the acting user or role. Server code derives both from the authenticated session, rechecks the active user record, and verifies ownership or admin permission before data changes.

## Database model

- `users`: authorized AUIS identities, role, active status, profile/login timestamps
- `semesters`: named periods, date range, target hours, and `DRAFT`/`ACTIVE`/`ARCHIVED` state
- `semester_memberships`: unique intern-to-semester assignments
- `activities`: work date, hours, description, creator/editor accountability
- `audit_logs`: immutable important-event metadata, including deleted-record snapshots

The migration enforces lower-case unique AUIS emails, positive hours up to 12, valid semester dates, unique memberships, foreign keys, and a partial unique index allowing only one active semester.

## Local setup

Requirements: Node.js 20+, npm, a Neon project, and a Google Cloud OAuth client.

```bash
git clone https://github.com/Hawrami01/auis-it-intern-attendance.git
cd auis-it-intern-attendance
npm install
copy .env.example .env.local
```

Fill `.env.local`:

```dotenv
DATABASE_URL=postgresql://...
AUTH_SECRET=generate-a-long-random-secret
AUTH_GOOGLE_ID=your-google-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-google-client-secret
```

Generate `AUTH_SECRET` with `npx auth secret` or a cryptographically secure password generator. Never prefix these values with `NEXT_PUBLIC_`.

Then initialize and run:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. The seed is idempotent and creates:

- `ha23109@auis.edu.krd` as an active `ADMIN`
- `Fall 2026` as the initial active semester

Development fixtures are disabled by default. To add removable examples locally, set `SEED_DEMO_DATA=true` before running the seed; do not enable it in production.

## Google OAuth setup

1. Open **Google Cloud Console → APIs & Services** and select or create the department-owned project.
2. Configure the **OAuth consent screen**. Use an Internal app if AUIS Google Workspace policy permits it; otherwise complete the organization’s required testing/verification steps.
3. Create **Credentials → OAuth client ID → Web application**.
4. Add authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://auis-it-intern-attendance.vercel.app`
5. Add authorized redirect URIs exactly:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://auis-it-intern-attendance.vercel.app/api/auth/callback/google`
6. Put the client ID and secret in `.env.local` and in Vercel’s encrypted environment variables.

The Google `hd` hint improves account selection, but it is **not** treated as authorization. The Auth.js callback verifies Google’s `email_verified` claim, validates the exact `auis.edu.krd` domain, then queries the active authorized-user record. Removing either check would weaken the security model.

## Commands

| Command               | Purpose                                          |
| --------------------- | ------------------------------------------------ |
| `npm run dev`         | Start local development                          |
| `npm run db:generate` | Generate a migration from schema changes         |
| `npm run db:migrate`  | Apply committed migrations                       |
| `npm run db:seed`     | Seed the initial admin and semester idempotently |
| `npm run lint`        | Run ESLint                                       |
| `npm run typecheck`   | Check TypeScript                                 |
| `npm run test`        | Run unit/security/export tests                   |
| `npm run test:e2e`    | Run browser-level public-flow tests              |
| `npm run check`       | Lint, typecheck, unit test, and production build |

## Testing and acceptance

Automated coverage verifies domain/input validation, role/ownership permission rules, semester validation, and a readable two-sheet Excel workbook. Playwright checks the login/access-denied experience and horizontal overflow at 375, 768, 1024, and 1440 pixels.

OAuth-dependent acceptance requires real AUIS test accounts:

- non-AUIS Google account is rejected
- unregistered AUIS account reaches Access Denied
- registered student sees only their own data and cannot open admin routes
- administrator can add/deactivate an intern and manage any activity
- activity create/edit/delete and audit events persist
- a new active semester starts at zero while archived analytics remain unchanged
- Excel downloads open as `.xlsx` with both worksheets

## Vercel deployment

1. Import this GitHub repository into Vercel as a Next.js project.
2. Add `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` to **Production**, **Preview**, and **Development** only where appropriate. Avoid connecting untrusted previews to production data.
3. Run `npm run db:migrate` once against the production Neon branch before promoting the first deployment.
4. Deploy, add the production URL to Google’s authorized origin and callback lists, then redeploy if environment values changed.
5. Complete the OAuth acceptance checklist above and inspect Vercel runtime logs for errors.

The build command is `npm run build`; no static export is used because authentication, server actions, database access, and protected exports require a server runtime.

## Security notes

- Secrets remain in ignored `.env.local` files or encrypted hosting settings.
- All actions authenticate again and perform server-side role/ownership checks.
- Archived student records are read-only; administrators retain managed correction capability with audit events.
- Deactivation never cascades into historical deletion.
- Excel export returns `401`/`403` for missing or insufficient authorization and uses `private, no-store` caching.
- Security headers disable framing, MIME sniffing, unnecessary browser capabilities, and unsafe referrer leakage.
- This internal application publishes `robots.txt` with site-wide crawling disabled.

For a real deployment, add organizational monitoring/rate limiting and schedule Neon backup/restore exercises according to AUIS IT policy.

## Future improvements

- Department categories and supervisor approval workflow
- Optional immutable activity revision table beyond event snapshots
- Fine-grained export filters and scheduled reports
- SSO group synchronization after AUIS identity-governance approval
- Production telemetry with privacy-conscious retention

## License and ownership

Internal AUIS IT Department application. Confirm institutional licensing and data-retention policy before broader distribution.
