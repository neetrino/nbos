import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalSection, PublicLegalPageShell } from '@/components/legal/public-legal-page-shell';

const LAST_UPDATED = 'July 8, 2026';

export const metadata: Metadata = {
  title: 'Data Deletion Instructions — NBOS',
  description:
    'How to request deletion of personal data from NBOS, including Meta/Facebook/Instagram integration data.',
};

export default function DataDeletionPage() {
  return (
    <PublicLegalPageShell title="Data Deletion Instructions" lastUpdated={LAST_UPDATED}>
      <p>
        NBOS respects data deletion requests and provides the following ways to request removal of
        personal information.
      </p>

      <LegalSection title="1. NBOS Users and Employees">
        <p>
          If you are an NBOS user, employee, or invited administrator, contact your NBOS
          administrator or email:
        </p>
        <p>
          <a
            href="mailto:nbos@neetrino.com"
            className="text-foreground underline-offset-4 hover:underline"
          >
            nbos@neetrino.com
          </a>
        </p>
        <p>
          Please include your name, email address, and the reason for your request. Depending on
          your role and company obligations, your account may be deactivated, terminated, or deleted
          according to internal retention and compliance requirements.
        </p>
      </LegalSection>

      <LegalSection title="2. Instagram and Facebook Users">
        <p>
          If you sent a message to a Facebook Page or Instagram Professional account connected to
          NBOS, your message may have created a CRM Lead in NBOS. This may include your platform
          sender ID, message ID, timestamp, and a short message preview.
        </p>
        <p>To request deletion of this information, email:</p>
        <p>
          <a
            href="mailto:nbos@neetrino.com"
            className="text-foreground underline-offset-4 hover:underline"
          >
            nbos@neetrino.com
          </a>
        </p>
        <p>Please include:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Your name.</li>
          <li>Your Instagram or Facebook handle, if available.</li>
          <li>The Facebook Page or Instagram account you contacted.</li>
          <li>The approximate date of your message.</li>
          <li>A short description of the request.</li>
        </ul>
        <p>
          We may ask for additional information to verify the request before deleting or anonymizing
          relevant records.
        </p>
      </LegalSection>

      <LegalSection title="3. Business Administrators">
        <p>
          Authorized NBOS administrators can disconnect Facebook Pages or Instagram accounts from
          NBOS in:
        </p>
        <p className="text-foreground font-medium">Settings → Integrations</p>
        <p>
          Disconnecting an account removes stored integration credentials and stops future message
          ingestion. Existing CRM Leads or historical records may require a separate deletion
          request.
        </p>
      </LegalSection>

      <LegalSection title="4. Meta/Facebook App Data">
        <p>
          For data received through the NBOS Meta/Facebook App, deletion requests can be sent to:
        </p>
        <p>
          <a
            href="mailto:nbos@neetrino.com"
            className="text-foreground underline-offset-4 hover:underline"
          >
            nbos@neetrino.com
          </a>
        </p>
        <p>
          We will review and process valid requests according to applicable legal, security, and
          business requirements.
        </p>
      </LegalSection>

      <LegalSection title="5. Privacy Policy">
        <p>
          For more information about how NBOS collects, uses, and protects data, see our Privacy
          Policy:
        </p>
        <p>
          <Link
            href="/privacy-policy"
            className="text-foreground underline-offset-4 hover:underline"
          >
            https://nbos.neetrino.com/privacy-policy
          </Link>
        </p>
      </LegalSection>
    </PublicLegalPageShell>
  );
}
