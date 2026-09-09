# Confirmed inactive-account removal

The owner explicitly confirmed permanent removal of the inactive AUIS student
account with user ID 349bdd7b-ec04-4377-b399-92a590206289.

The production inspection found no owned, created or edited activities, no
created semesters, and no audit records where this user was the actor. Its only
foreign-key child was an inactive, empty Fall 2026 membership. Three historical
administrative audit references were retained; they cannot authenticate or
recreate a user. No Auth.js account/provider/session tables exist in this JWT
application.

The one-time guarded SQL under scripts/sql was tested on the isolated QA branch,
then applied to production after confirmation. It locks the exact user, verifies
identity and all known references, and asserts other users, activities,
memberships and audit records are unchanged. It is deliberately not an automatic
migration or seed step.

Post-transaction production results:

- Zero rows for the removed normalized email and zero memberships for its ID.
- Six other users preserved, including the AUIS administrator and Gmail student.
- All seven activities, 23 hours and 17 audit records preserved.
- Zero duplicate normalized emails.

The seed entry, positive fixture expectation and README provisioning list were
removed. Remaining executable references are only the guarded DELETE operation
and a negative browser regression test, neither of which creates this account.
The existing unique email index, lowercase and whitespace constraints continue
to enforce canonical email identity. Google sign-in requires an existing active
user; JWT refresh rejects nonexistent users and mismatched application user IDs.
Deployments do not import QA data or invoke database seeding.

Validation: lint, TypeScript, all 22 unit tests and production build passed.
The isolated browser regression also confirmed no Interns row and rejection of
the removed identity's stale token without recreating its account.
