# Layout, account identity, and role correction

## Scope and decisions

This focused pass preserves the AUIS V3 design, data, authentication, targets, charts, favicon, and fixed footer.

- Semester summaries share a component with a full-width text column, grouped unbroken metadata, a status badge, and responsive action placement. The semester grid aligns cards at the top, so expanding one form does not stretch its neighbor.
- Tables no longer force every cell to wrap anywhere. Long activity descriptions may wrap; short dates, figures, and labels stay readable. Truncated emails expose the full address in a title.
- Intern management returns one row per user and now shows current semester context. Administrator profiles do not show personal intern metrics or membership controls.
- Student-only page access and activity creation use the centralized canLogActivity rule and a fresh database-backed user lookup. Admin editing/deleting student activities remains authorized.
- Account creation, Google login, and session lookup use lowercase/trimmed identity. The existing unique email index and lowercase check are strengthened by migration 0005's whitespace check. Duplicate-key races return the same clear duplicate-account error. Invalid add-account submissions retain the entered name/email.

## Production account inspection

Read-only inspection found zero normalized duplicate email groups and zero unnormalized addresses. Production had 7 users, 7 activities totaling 23 hours, and 7 semester memberships.

The personal Gmail account is a single active student identity with five activities. The similarly named inactive AUIS address is a different email. The user explicitly chose to keep that account unchanged. No account was merged, deleted, archived, or reassigned.

All three configured administrators were active ADMIN users. Auth.js uses Google JWT sessions, not an adapter creating extra application user/provider account rows.

Migration 0005 was tested on the isolated QA branch before production. After production migration, the record counts and total hours above were unchanged.

## Verification

- Lint, TypeScript, 22 unit tests, and Next.js production build passed.
- The 42-test full browser suite passed. It covers student and admin navigation at 11 widths from 320 through 1920 pixels, no page/workspace horizontal overflow, footer boundaries, navigation fit, filters, target forms, charts, exports, student CRUD, deletion protections, and database-role enforcement.
- Direct create-activity requests were rejected for every configured administrator, even with a STUDENT claim in the QA session.
- Lowercase, uppercase, and whitespace-padded personal-email creation attempts returned the duplicate message and retained the canonical user ID.
- Supplemental tests exercise admin edit/delete of a QA student activity and capture the actual Fall 2026 cards at all eight requested widths.
- Browser screenshots are generated locally under test-results; tests requiring authenticated sessions run only against the isolated QA database.

## Evidence limits

Local role tests use signed QA sessions; they do not claim a fresh Google OAuth login for all three administrators. Production verification uses the existing signed-in student browser plus deployment status, unauthenticated endpoint checks, and read-only production database checks. Automated Chromium checks and visual review are not a complete WCAG, Safari, or assistive-technology certification.
