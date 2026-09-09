# Session, mobile background and canonical-account review

## Production identity audit (2026-09-09)

The normalized-email duplicate query returned zero groups. Gmail resolves to one
active STUDENT, Hazhir personal (five activities, one semester membership).
The inactive Hazhir Aso record uses a different AUIS email, not Gmail. It is
unchanged, honoring the owner's explicit instruction to preserve that account.
No production deletion or data reassignment was necessary or performed.

The unique email index plus lowercase and whitespace CHECK constraints prevent
normalized duplicates. Administrative creation normalizes first and reports an
existing account; its review link leads to the existing profile and reactivation
control for inactive, non-deleted students. Google sign-in only looks up an
authorized existing user and never inserts application users. This application
uses JWT sessions without an Auth.js database adapter/provider-account tables.

## Session correction

The actual limit was eight hours. Session and JWT maxAge are now both 30 days.
The installed Auth.js JWT session handler rotates the encrypted token and expiry
when accessed. The existing auth-wrapped Next.js proxy forwards its Set-Cookie
headers, including on normal application navigation. Database-only updateAge is
not applicable to this JWT strategy.

Auth.js defaults retain HttpOnly, SameSite=Lax, root-path cookies and Secure on
production HTTPS. No browser localStorage identity, custom plain tokens, or
Google API access-token expiry checks were introduced. Production AUTH_SECRET
was confirmed present in Vercel (created 13 days earlier), and was not changed.
Already-expired old sessions cannot be resurrected and require sign-in once.

JWT refresh and the server data-access layer check the canonical account's
current existence, active/deleted status and role. Existing tokens are also bound
to the original application user ID, so reusing a deleted user's email cannot
revive their token. Admin personal logging restrictions remain unchanged.

## Mobile rendering

One non-interactive canvas now runs at all viewport widths. It uses 24 ambient
particles on phones, 48 on tablets and 80 on desktop, with capped pixel ratio
and 24/30 FPS drawing. Passive pointer events update effect-local values only;
touch influence fades in 1.2 seconds. No React state changes, device permissions
or pointer capture are involved. Hidden tabs cancel animation; reduced motion
disables the canvas while the site's static digital styling remains.

## Verification design

All write-based automated tests use the separate Neon QA branch, never production.
Regression tests cover navigation, permissions, CRUD, exports and responsive
layouts. Additional tests check 30-day cookie/JWT renewal, persistent storage
across closed/reopened browser contexts for both roles, touch animation and form
interaction at 320/375/390/430/768px, reduced motion, live role changes,
deactivation, deletion and rejection of a replacement identity's old cookie.
Browser-context reopening simulates cookie persistence; it is not a claim that
30 real days elapsed or that browser settings cannot clear cookies.

Validation: 22 unit tests passed. All 52 browser scenarios passed across the
full run and focused reruns: the initial run had 49 passes plus two failures
(a five-second save wait and a transient Neon fetch failure); both passed on
rerun. The added identity-revocation scenario passed separately. The seven
session/mobile tests passed again after adding touch navigation, drawer,
scrolling and accessible-chart expansion checks. Phone and tablet screenshots
were visually inspected. Lint and TypeScript checks passed.
