import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="August 26, 2026">
      <p>
        The AUIS IT Intern Portal is an internal attendance and
        activity-record system for authorized AUIS IT Department interns and
        administrators.
      </p>

      <LegalSection title="Information we collect">
        <p>
          When you sign in, Google provides your name, Google email address, and
          profile image. The portal also stores attendance activities you submit,
          including dates, hours, task categories, descriptions, semester
          assignments, and administrative audit records.
        </p>
      </LegalSection>

      <LegalSection title="How information is used">
        <p>
          Information is used only to authenticate approved users, maintain
          internship records, calculate progress, support departmental review,
          export authorized reports, and protect the integrity of the system.
          The portal does not sell personal information or use it for advertising.
        </p>
      </LegalSection>

      <LegalSection title="Access, retention, and security">
        <p>
          Access is restricted to approved, active users with an
          <span className="whitespace-nowrap"> @auis.edu.krd</span> account.
          Role and ownership checks are enforced on the server. Records are kept
          for legitimate internship administration and may be corrected or
          removed by an authorized administrator according to AUIS policy.
        </p>
      </LegalSection>

      <LegalSection title="Third-party services">
        <p>
          The portal uses Google for authentication, Vercel for application
          hosting, and Neon for database hosting. Each provider processes only
          the information required to deliver its service under its own privacy
          and security terms.
        </p>
      </LegalSection>

      <LegalSection title="Questions and requests">
        <p>
          For privacy questions, record-access requests, or corrections, contact
          the AUIS IT Department or the portal administrator through your official
          AUIS communication channels.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
