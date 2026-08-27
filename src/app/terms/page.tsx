import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="August 26, 2026">
      <p>
        By using the AUIS IT Intern Portal, you agree to use it only
        for legitimate AUIS internship attendance and administrative purposes.
      </p>

      <LegalSection title="Authorized use">
        <p>
          You must sign in with your own approved AUIS account. Do not share
          access, attempt to view another intern&apos;s private records, bypass role
          restrictions, or use the portal for an unrelated purpose.
        </p>
      </LegalSection>

      <LegalSection title="Accurate records">
        <p>
          Interns are responsible for submitting truthful, complete activity
          records. Administrators may review, correct, export, deactivate, or
          audit records when required for internship administration.
        </p>
      </LegalSection>

      <LegalSection title="Availability and changes">
        <p>
          The portal may be updated, temporarily unavailable, or changed to meet
          operational, security, or AUIS policy requirements. Important records
          should be handled according to the department&apos;s official retention and
          reporting procedures.
        </p>
      </LegalSection>

      <LegalSection title="Prohibited activity">
        <p>
          You may not submit malicious content, interfere with the service,
          automate unauthorized access, impersonate another person, or attempt to
          extract information you are not permitted to access.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these terms or portal access should be directed to the
          AUIS IT Department through official AUIS communication channels.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
