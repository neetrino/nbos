import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalSection, PublicLegalPageShell } from '@/components/legal/public-legal-page-shell';

const LAST_UPDATED = 'July 8, 2026';

export const metadata: Metadata = {
  title: 'Privacy Policy — NBOS',
  description:
    'Privacy Policy for NBOS by Neetrino IT Company, including Meta/Facebook/Instagram integration disclosures.',
};

export default function PrivacyPolicyPage() {
  return (
    <PublicLegalPageShell title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <LegalSection title="1. Introduction">
        <p>
          NBOS is a business operations platform by Neetrino IT Company. This Privacy Policy
          explains how NBOS collects, uses, stores, and protects information when employees,
          administrators, business users, and connected third-party platform users interact with
          NBOS and its integrations.
        </p>
        <p>
          This policy also applies to the Meta/Facebook App used by NBOS to connect Facebook Pages
          and Instagram Professional accounts for business messaging and CRM lead creation.
        </p>
      </LegalSection>

      <LegalSection title="2. Who We Are">
        <p>
          NBOS is operated by Neetrino IT Company. NBOS is designed as an internal business
          operations and CRM platform for managing company workflows, CRM leads, marketing
          attribution, files, finance, communication, and business integrations.
        </p>
        <p>
          Website:{' '}
          <a
            href="https://nbos.neetrino.com"
            className="text-foreground underline-offset-4 hover:underline"
          >
            https://nbos.neetrino.com
          </a>
          <br />
          API domain:{' '}
          <a
            href="https://api.nbos.neetrino.com"
            className="text-foreground underline-offset-4 hover:underline"
          >
            https://api.nbos.neetrino.com
          </a>
          <br />
          Contact email:{' '}
          <a
            href="mailto:nbos@neetrino.com"
            className="text-foreground underline-offset-4 hover:underline"
          >
            nbos@neetrino.com
          </a>
        </p>
      </LegalSection>

      <LegalSection title="3. Who This Policy Applies To">
        <p>This policy applies to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>NBOS employees, administrators, and authorized users.</li>
          <li>
            Business contacts, leads, clients, partners, and other people whose information is
            stored in NBOS.
          </li>
          <li>
            People who send messages to connected Facebook Pages or Instagram Professional accounts
            that are integrated with NBOS.
          </li>
          <li>
            Users who authorize NBOS through Meta/Facebook OAuth to connect business accounts.
          </li>
        </ul>
        <p>
          NBOS is not intended for public self-registration. Access is generally invite-only and
          controlled by authorized administrators.
        </p>
      </LegalSection>

      <LegalSection title="4. Information We Collect">
        <p>
          Depending on how NBOS is used, we may collect and store the following categories of
          information:
        </p>
        <p className="text-foreground font-medium">Account and employee information:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Name, email address, phone number, role, department, job title, work status, avatar, and
            related employment information.
          </li>
          <li>Authentication and session information needed to secure access.</li>
        </ul>
        <p className="text-foreground font-medium">CRM and business information:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Lead names, contact names, phone numbers, email addresses, notes, source attribution,
            marketing account information, assigned users, and CRM status.
          </li>
          <li>
            Client, company, deal, project, support, and finance records entered by authorized NBOS
            users.
          </li>
        </ul>
        <p className="text-foreground font-medium">Files and documents:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Uploaded files, attachments, file metadata, document records, and access information.
          </li>
        </ul>
        <p className="text-foreground font-medium">Communication data:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Internal messages and notifications between NBOS users.</li>
          <li>Email-related data if mail integrations are connected.</li>
          <li>
            Instagram Direct and Facebook Messenger metadata and message previews when Meta
            integrations are connected.
          </li>
        </ul>
        <p className="text-foreground font-medium">Technical and security data:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            IP addresses, audit logs, authentication events, access logs, error logs, and system
            activity needed to protect and operate NBOS.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Meta, Facebook, and Instagram Integration Data">
        <p>
          NBOS allows authorized administrators to connect Facebook Pages and Instagram Professional
          accounts through Meta/Facebook OAuth.
        </p>
        <p>When this integration is enabled, NBOS may receive and process:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Facebook Page IDs.</li>
          <li>Instagram Business Account IDs.</li>
          <li>Connected account display names.</li>
          <li>Access tokens and integration credentials, stored in encrypted form.</li>
          <li>Webhook event IDs and message IDs.</li>
          <li>Sender IDs from Instagram or Facebook messaging events.</li>
          <li>Message timestamps.</li>
          <li>Short message previews from incoming direct messages.</li>
          <li>
            Page or account identifiers needed to route messages to the correct NBOS marketing
            source.
          </li>
        </ul>
        <p>
          Incoming Instagram Direct or Facebook Messenger messages may automatically create a CRM
          Lead in NBOS. For the current MVP implementation:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>NBOS creates Leads only.</li>
          <li>NBOS does not automatically create Contacts.</li>
          <li>NBOS does not automatically create Deals.</li>
          <li>NBOS does not provide a public chat or reply interface for Meta messages.</li>
          <li>
            NBOS does not process WhatsApp, Facebook Lead Ads, comments, or Instagram comments as
            part of this MVP.
          </li>
        </ul>
        <p>
          Connected Meta access tokens are encrypted and used only to maintain the integration and
          receive authorized messaging events.
        </p>
      </LegalSection>

      <LegalSection title="6. How We Use Information">
        <p>We use information to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide and operate NBOS.</li>
          <li>Authenticate users and protect accounts.</li>
          <li>
            Manage CRM leads, business operations, files, projects, finance, support, and internal
            workflows.
          </li>
          <li>Attribute leads to marketing channels and connected business accounts.</li>
          <li>
            Create CRM Leads from incoming Instagram Direct or Facebook Messenger messages when a
            connected account is configured.
          </li>
          <li>Maintain security, audit trails, and system reliability.</li>
          <li>Send transactional notifications and administrative emails.</li>
          <li>Comply with legal, security, and operational requirements.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. How We Share Information">
        <p>We do not sell personal information.</p>
        <p>We may share information only when necessary:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>With authorized NBOS users inside the organization.</li>
          <li>With infrastructure and service providers that help operate NBOS.</li>
          <li>
            With connected third-party platforms, such as Meta, Google, email providers, storage
            providers, and hosting providers, only as required for integration functionality.
          </li>
          <li>
            When required by law, legal process, security obligations, or to protect the rights and
            safety of NBOS, Neetrino, users, clients, or others.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Third-Party Service Providers">
        <p>
          NBOS may use third-party providers for hosting, database storage, file storage, email
          delivery, authentication, integrations, and infrastructure. These may include:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Meta / Facebook / Instagram for OAuth, connected business accounts, and messaging
            webhooks.
          </li>
          <li>Neon PostgreSQL for database hosting.</li>
          <li>Cloudflare R2 for file storage.</li>
          <li>Redis / Upstash Redis for caching, queues, or token/session-related operations.</li>
          <li>Resend for transactional email.</li>
          <li>Google services if Gmail or Google integrations are connected.</li>
          <li>Hosting, monitoring, and infrastructure providers used to operate NBOS.</li>
        </ul>
        <p>These providers process data only as needed to provide their services to NBOS.</p>
      </LegalSection>

      <LegalSection title="9. Data Storage and Security">
        <p>NBOS uses technical and organizational safeguards to protect information, including:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Encrypted storage of integration tokens and credentials.</li>
          <li>Access control and role-based permissions.</li>
          <li>Secure authentication and session handling.</li>
          <li>HTTPS for production services.</li>
          <li>Audit logs and security monitoring.</li>
          <li>Separation of public and authenticated routes.</li>
          <li>Restricted administrative access.</li>
        </ul>
        <p>
          No system can guarantee absolute security, but NBOS is designed to reduce unauthorized
          access, disclosure, alteration, or loss of information.
        </p>
      </LegalSection>

      <LegalSection title="10. Data Retention">
        <p>
          NBOS retains information for as long as necessary to operate the platform, support
          business workflows, comply with legal or operational obligations, and maintain
          auditability.
        </p>
        <p>
          Some deleted business records may be moved to trash or soft-deleted before permanent
          removal according to system retention rules. Certain audit logs, security logs, and
          integration event records may be retained for operational, troubleshooting, and compliance
          purposes.
        </p>
        <p>
          Meta webhook events and Meta-derived CRM Leads may be retained as part of CRM history
          unless a valid deletion request is submitted and approved.
        </p>
      </LegalSection>

      <LegalSection title="11. Your Rights and Choices">
        <p>Depending on your location and relationship with NBOS, you may have rights to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Request access to personal information.</li>
          <li>Request correction of inaccurate information.</li>
          <li>Request deletion of certain information.</li>
          <li>Object to or restrict certain processing.</li>
          <li>Disconnect connected integrations where you are an authorized administrator.</li>
        </ul>
        <p>
          NBOS employees should contact their administrator or company representative for
          account-related requests. External individuals, including people who contacted a connected
          Instagram or Facebook account, may contact us using the email below.
        </p>
      </LegalSection>

      <LegalSection title="12. Data Deletion Requests">
        <p>
          To request deletion of information associated with NBOS or Meta/Facebook/Instagram
          integrations, contact:
        </p>
        <p>
          <a
            href="mailto:nbos@neetrino.com"
            className="text-foreground underline-offset-4 hover:underline"
          >
            nbos@neetrino.com
          </a>
        </p>
        <p>Please include enough information to identify the relevant data, such as:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Your name.</li>
          <li>Your contact email.</li>
          <li>The Instagram or Facebook account/page you contacted.</li>
          <li>Approximate date of the message.</li>
          <li>Any relevant sender handle or message context.</li>
        </ul>
        <p>
          For security reasons, we may need to verify your identity or authority before processing a
          request.
        </p>
        <p>
          Authorized NBOS administrators may also disconnect Meta accounts from the NBOS
          Integrations settings. Disconnecting an integration removes stored integration secrets and
          stops future message ingestion, but may not automatically delete existing CRM Leads or
          historical records unless separately requested.
        </p>
        <p>
          See also our{' '}
          <Link
            href="/data-deletion"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Data Deletion Instructions
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="13. International Data Transfers">
        <p>
          NBOS and its service providers may process and store information in countries other than
          your own. Where required, we use appropriate safeguards to protect information according
          to applicable laws and service provider agreements.
        </p>
      </LegalSection>

      <LegalSection title="14. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. When we make material changes, we
          will update the &quot;Last updated&quot; date and may notify users through NBOS or other
          appropriate channels.
        </p>
      </LegalSection>

      <LegalSection title="15. Contact Us">
        <p>
          For privacy questions, data requests, or Meta/Facebook/Instagram data deletion requests,
          contact:
        </p>
        <p>
          Neetrino IT Company
          <br />
          Email:{' '}
          <a
            href="mailto:nbos@neetrino.com"
            className="text-foreground underline-offset-4 hover:underline"
          >
            nbos@neetrino.com
          </a>
          <br />
          Website:{' '}
          <a
            href="https://nbos.neetrino.com"
            className="text-foreground underline-offset-4 hover:underline"
          >
            https://nbos.neetrino.com
          </a>
        </p>
      </LegalSection>
    </PublicLegalPageShell>
  );
}
