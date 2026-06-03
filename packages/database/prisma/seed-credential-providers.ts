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

/** Shared catalog: hosting, domain, mail, cloud, SaaS (one list). */
export const CREDENTIAL_PROVIDER_SEEDS: CredentialProviderSeedRow[] = [
  { name: 'Beget', website: 'https://beget.com' },
  { name: 'Reg.ru', website: 'https://www.reg.ru' },
  { name: 'Name.am', website: 'https://www.name.am' },
  { name: 'Amnic', website: 'https://www.amnic.net' },
  { name: 'Timeweb', website: 'https://timeweb.com' },
  { name: 'Selectel', website: 'https://selectel.ru' },
  { name: 'Hostinger', website: 'https://www.hostinger.com' },
  { name: 'DigitalOcean', website: 'https://www.digitalocean.com' },
  { name: 'Hetzner', website: 'https://www.hetzner.com' },
  { name: 'AWS', website: 'https://aws.amazon.com' },
  { name: 'Google Cloud', website: 'https://cloud.google.com' },
  { name: 'Vercel', website: 'https://vercel.com' },
  { name: 'Cloudflare', website: 'https://www.cloudflare.com' },
  { name: 'Namecheap', website: 'https://www.namecheap.com' },
  { name: 'GoDaddy', website: 'https://www.godaddy.com' },
  { name: 'Google', website: 'https://google.com' },
  { name: 'Yandex', website: 'https://yandex.ru' },
  { name: 'Mail.ru', website: 'https://mail.ru' },
  { name: 'Microsoft', website: 'https://www.microsoft.com' },
  { name: 'Zoho', website: 'https://www.zoho.com' },
  { name: 'SendGrid', website: 'https://sendgrid.com' },
  { name: 'Google Workspace', website: 'https://workspace.google.com' },
  { name: 'Neon', website: 'https://neon.tech' },
  { name: 'GitHub', website: 'https://github.com' },
  { name: 'GitLab', website: 'https://about.gitlab.com' },
  { name: 'Stripe', website: 'https://stripe.com' },
  { name: 'OpenAI', website: 'https://openai.com' },
  { name: 'Apple', website: 'https://developer.apple.com' },
  { name: 'Google Play', website: 'https://play.google.com/console' },
  { name: 'Firebase', website: 'https://firebase.google.com' },
  { name: 'WordPress', website: 'https://wordpress.com' },
  { name: 'Adobe', website: 'https://www.adobe.com' },
  { name: 'Figma', website: 'https://www.figma.com' },
  { name: 'HubSpot', website: 'https://www.hubspot.com' },
  { name: 'Telegram', website: 'https://telegram.org' },
  { name: 'Slack', website: 'https://slack.com' },
  { name: 'NBOS', website: 'https://nbos.local' },
  { name: 'LegacyMaps' },
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
