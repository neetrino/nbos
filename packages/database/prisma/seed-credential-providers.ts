import type { PrismaClient } from '../src/generated/prisma/client';

function slugifyCredentialProviderName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug.length > 0 ? slug : 'provider';
}

export interface CredentialProviderSeedRow {
  name: string;
  website?: string;
}

const HOSTING_AND_CLOUD_PROVIDERS: CredentialProviderSeedRow[] = [
  { name: 'Beget', website: 'https://beget.com' },
  { name: 'Timeweb', website: 'https://timeweb.com' },
  { name: 'Selectel', website: 'https://selectel.ru' },
  { name: 'Hostinger', website: 'https://www.hostinger.com' },
  { name: 'DigitalOcean', website: 'https://www.digitalocean.com' },
  { name: 'Hetzner', website: 'https://www.hetzner.com' },
  { name: 'AWS', website: 'https://aws.amazon.com' },
  { name: 'Google Cloud', website: 'https://cloud.google.com' },
  { name: 'Vercel', website: 'https://vercel.com' },
  { name: 'Cloudflare', website: 'https://www.cloudflare.com' },
  { name: 'Neon', website: 'https://neon.tech' },
  { name: 'Supabase', website: 'https://supabase.com' },
];

const DOMAIN_REGISTRAR_PROVIDERS: CredentialProviderSeedRow[] = [
  { name: 'Reg.ru', website: 'https://www.reg.ru' },
  { name: 'Name.am', website: 'https://www.name.am' },
  { name: 'Amnic', website: 'https://www.amnic.net' },
  { name: 'Namecheap', website: 'https://www.namecheap.com' },
  { name: 'GoDaddy', website: 'https://www.godaddy.com' },
];

const MAIL_AND_WORKSPACE_PROVIDERS: CredentialProviderSeedRow[] = [
  { name: 'Google Workspace', website: 'https://workspace.google.com' },
  { name: 'Microsoft', website: 'https://www.microsoft.com' },
  { name: 'Zoho', website: 'https://www.zoho.com' },
  { name: 'Yandex', website: 'https://yandex.ru' },
  { name: 'Mail.ru', website: 'https://mail.ru' },
  { name: 'SendGrid', website: 'https://sendgrid.com' },
  { name: 'Mailgun', website: 'https://www.mailgun.com' },
];

const DEV_AND_API_PROVIDERS: CredentialProviderSeedRow[] = [
  { name: 'GitHub', website: 'https://github.com' },
  { name: 'GitLab', website: 'https://about.gitlab.com' },
  { name: 'Stripe', website: 'https://stripe.com' },
  { name: 'OpenAI', website: 'https://openai.com' },
  { name: 'Firebase', website: 'https://firebase.google.com' },
];

const APP_STORE_PROVIDERS: CredentialProviderSeedRow[] = [
  { name: 'Apple', website: 'https://developer.apple.com' },
  { name: 'Google Play', website: 'https://play.google.com/console' },
];

const SAAS_TOOL_PROVIDERS: CredentialProviderSeedRow[] = [
  { name: 'Google', website: 'https://google.com' },
  { name: 'WordPress', website: 'https://wordpress.com' },
  { name: 'Adobe', website: 'https://www.adobe.com' },
  { name: 'Figma', website: 'https://www.figma.com' },
  { name: 'HubSpot', website: 'https://www.hubspot.com' },
  { name: 'Telegram', website: 'https://telegram.org' },
  { name: 'Slack', website: 'https://slack.com' },
  { name: 'Notion', website: 'https://www.notion.so' },
];

/** Demo-only labels referenced in `seed-credentials-demo.ts`. */
const DEMO_PROVIDERS: CredentialProviderSeedRow[] = [
  { name: 'NBOS', website: 'https://nbos.local' },
  { name: 'LegacyMaps' },
];

/** Shared catalog: hosting, domain, mail, cloud, SaaS (one list). Canon: `08-Credential-Provider-Catalog.md`. */
export const CREDENTIAL_PROVIDER_SEEDS: CredentialProviderSeedRow[] = [
  ...HOSTING_AND_CLOUD_PROVIDERS,
  ...DOMAIN_REGISTRAR_PROVIDERS,
  ...MAIL_AND_WORKSPACE_PROVIDERS,
  ...DEV_AND_API_PROVIDERS,
  ...APP_STORE_PROVIDERS,
  ...SAAS_TOOL_PROVIDERS,
  ...DEMO_PROVIDERS,
];

/** Inserts catalog rows; returns slug → id (includes upsert for re-runs). */
export async function seedCredentialProviders(prisma: PrismaClient): Promise<Map<string, string>> {
  const slugToId = new Map<string, string>();

  for (const row of CREDENTIAL_PROVIDER_SEEDS) {
    const slug = slugifyCredentialProviderName(row.name);
    const record = await prisma.credentialProvider.upsert({
      where: { slug },
      create: {
        name: row.name,
        slug,
        website: row.website,
        isSeeded: true,
      },
      update: {
        name: row.name,
        website: row.website ?? undefined,
        isSeeded: true,
        archivedAt: null,
      },
    });
    slugToId.set(slug, record.id);
  }

  return slugToId;
}

/** Resolves display name to provider id, creating a non-seeded row if missing. */
export async function resolveCredentialProviderId(
  prisma: PrismaClient,
  providerName: string | undefined,
  slugToId: Map<string, string>,
): Promise<string | undefined> {
  if (!providerName?.trim()) return undefined;
  const name = providerName.trim();
  const slug = slugifyCredentialProviderName(name);
  const existing = slugToId.get(slug);
  if (existing) return existing;

  const created = await prisma.credentialProvider.upsert({
    where: { slug },
    create: { name, slug, isSeeded: false },
    update: { archivedAt: null },
  });
  slugToId.set(slug, created.id);
  return created.id;
}
