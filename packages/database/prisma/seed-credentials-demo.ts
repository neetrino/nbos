import { createCipheriv, randomBytes, scryptSync } from 'crypto';
import type { PrismaClient } from '../src/generated/prisma/client';
import { resolveCredentialProviderId, seedCredentialProviders } from './seed-credential-providers';
import type {
  CredentialAccessLevelEnum,
  CredentialCategoryEnum,
  CredentialCriticalityEnum,
  CredentialTypeEnum,
} from '../src/generated/prisma/enums';

const DEMO_ENCRYPTION_KEY_FALLBACK = 'nbos-dev-seed-credentials-key-32b';
const ROTATION_DUE_SOON_DAYS = 14;

type EmployeeRef = { id: string };

export interface SeedCredentialsDemoContext {
  ceo: EmployeeRef;
  pm: EmployeeRef;
  pm2: EmployeeRef;
  dev: EmployeeRef;
  designer: EmployeeRef;
  seller: EmployeeRef;
  products: {
    acmeSite: { id: string; projectId: string };
    techstartApp: { id: string; projectId: string };
    medtechBlog: { id: string; projectId: string };
  };
}

interface CredentialSeedRow {
  name: string;
  category: CredentialCategoryEnum;
  credentialType: CredentialTypeEnum;
  criticality: CredentialCriticalityEnum;
  accessLevel: CredentialAccessLevelEnum;
  projectId?: string;
  productId?: string;
  domainId?: string;
  clientServiceRecordId?: string;
  ownerId?: string;
  rotationOwnerId?: string;
  provider?: string;
  url?: string;
  login?: string;
  phone?: string;
  password?: string;
  apiKey?: string;
  envData?: string;
  secureNotes?: string;
  publicNotes?: string;
  allowedEmployees?: string[];
  lastRotatedAt?: Date;
  nextRotationAt?: Date | null;
  trashedAt?: Date;
}

interface ProductSlotBinding {
  productId: string;
  slotKey: string;
  credentialName: string;
}

const V2_KEY_SALT = 'NBOS_CREDENTIALS_ENCRYPTION_V2';

function deriveV2Key(secret: string): Buffer {
  return scryptSync(secret, V2_KEY_SALT, 32, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
}

function encryptField(plaintext: string, key: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', deriveV2Key(key), iv, { authTagLength: 16 });
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const body = `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
  return `v2:${body}`;
}

function resolveEncryptionKey(): string {
  const fromEnv = process.env.CREDENTIALS_ENCRYPTION_KEY?.trim();
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  console.warn(
    '  ⚠ seed-credentials-demo: CREDENTIALS_ENCRYPTION_KEY missing/short — using dev fallback',
  );
  return DEMO_ENCRYPTION_KEY_FALLBACK;
}

function addUtcDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function encryptSecrets(row: CredentialSeedRow, key: string): CredentialSeedRow {
  return {
    ...row,
    password: row.password ? encryptField(row.password, key) : undefined,
    apiKey: row.apiKey ? encryptField(row.apiKey, key) : undefined,
    envData: row.envData ? encryptField(row.envData, key) : undefined,
    secureNotes: row.secureNotes ? encryptField(row.secureNotes, key) : undefined,
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Every demo row gets at least one secret; PERSONAL/SECRET/… always include password for reveal QA. */
function ensureDemoSecrets(row: CredentialSeedRow): CredentialSeedRow {
  const slug = slugify(row.name);
  const withPassword =
    row.password ??
    (row.credentialType === 'SSH_PRIVATE_KEY' || row.credentialType === 'RECOVERY_CODES'
      ? undefined
      : `pwd-${row.accessLevel.toLowerCase()}-${slug}`);

  const withApiKey =
    row.apiKey ??
    (row.credentialType === 'API_KEY' ? `api-${row.accessLevel.toLowerCase()}-${slug}` : undefined);

  const withEnv =
    row.envData ??
    (row.credentialType === 'ENV_BUNDLE'
      ? `DEMO_ENV_${row.accessLevel}=1\nSECRET_${row.accessLevel}=***`
      : undefined);

  const withSecureNotes =
    row.secureNotes ??
    (row.credentialType === 'SSH_PRIVATE_KEY'
      ? `-----BEGIN DEMO KEY-----\n${slug}\n-----END DEMO KEY-----`
      : row.credentialType === 'RECOVERY_CODES'
        ? `RC-${row.accessLevel}-01\nRC-${row.accessLevel}-02`
        : undefined);

  const merged: CredentialSeedRow = {
    ...row,
    password: withPassword,
    apiKey: withApiKey,
    envData: withEnv,
    secureNotes: withSecureNotes,
  };

  const hasAnySecret = merged.password || merged.apiKey || merged.envData || merged.secureNotes;
  if (!hasAnySecret) {
    merged.password = `pwd-${row.accessLevel.toLowerCase()}-${slug}`;
  }

  return merged;
}

function personalOwnerForIndex(
  ctx: SeedCredentialsDemoContext,
  idx: number,
): { ownerId: string; login: string } {
  const owners = [
    { ownerId: ctx.pm.id, login: 'artur@neetrino.com' },
    { ownerId: ctx.dev.id, login: 'karen@neetrino.com' },
    { ownerId: ctx.ceo.id, login: 'suren@neetrino.com' },
    { ownerId: ctx.pm2.id, login: 'tigran@neetrino.com' },
  ];
  return owners[idx % owners.length]!;
}

function secretAllowedEmployees(ctx: SeedCredentialsDemoContext, idx: number): string[] {
  const pools = [
    [ctx.pm.id],
    [ctx.pm.id, ctx.dev.id],
    [ctx.ceo.id, ctx.pm.id],
    [ctx.seller.id, ctx.ceo.id],
    [ctx.pm2.id, ctx.dev.id],
  ];
  return pools[idx % pools.length]!;
}

function buildShowcaseRows(ctx: SeedCredentialsDemoContext, now: Date): CredentialSeedRow[] {
  const { ceo, pm, pm2, dev, designer, seller } = ctx;
  const team = [pm.id, dev.id];
  const overdue = addUtcDays(now, -30);
  const dueSoon = addUtcDays(now, ROTATION_DUE_SOON_DAYS - 3);
  const healthy = addUtcDays(now, 120);

  return [
    {
      name: 'ACME — Vercel — Production — Deployment',
      category: 'HOSTING',
      credentialType: 'HOSTING_SERVER',
      criticality: 'HIGH',
      accessLevel: 'PROJECT_TEAM',
      projectId: ctx.products.acmeSite.projectId,
      productId: ctx.products.acmeSite.id,
      ownerId: pm.id,
      rotationOwnerId: pm.id,
      provider: 'Vercel',
      url: 'https://vercel.com/acme',
      login: 'admin@acme.am',
      password: 'Acme-Vercel-2026!',
      allowedEmployees: team,
      lastRotatedAt: addUtcDays(now, -60),
      nextRotationAt: healthy,
    },
    {
      name: 'ACME — Namecheap — Production — DNS',
      category: 'DOMAIN',
      credentialType: 'DOMAIN_REGISTRAR',
      criticality: 'CRITICAL',
      accessLevel: 'SECRET',
      projectId: ctx.products.acmeSite.projectId,
      ownerId: pm.id,
      provider: 'Namecheap',
      url: 'https://ap.manage.namecheap.com',
      login: 'acme_dns',
      password: 'Nc-Dns-Root-8842',
      allowedEmployees: [pm.id],
      nextRotationAt: overdue,
    },
    {
      name: 'ACME — Neon — Production — Database',
      category: 'DATABASE',
      credentialType: 'DATABASE',
      criticality: 'CRITICAL',
      accessLevel: 'SECRET',
      projectId: ctx.products.acmeSite.projectId,
      productId: ctx.products.acmeSite.id,
      ownerId: pm.id,
      provider: 'Neon',
      login: 'neondb_owner',
      password: 'neon-super-secret-pw',
      envData: 'DATABASE_URL=postgresql://neondb_owner:***@neon.tech/acme_prod',
      allowedEmployees: [pm.id, dev.id],
      nextRotationAt: dueSoon,
    },
    {
      name: 'ACME — GitHub — CI Deploy Key',
      category: 'SERVICE',
      credentialType: 'SSH_PRIVATE_KEY',
      criticality: 'HIGH',
      accessLevel: 'PROJECT_TEAM',
      projectId: ctx.products.acmeSite.projectId,
      ownerId: dev.id,
      provider: 'GitHub',
      secureNotes:
        '-----BEGIN OPENSSH PRIVATE KEY-----\nDEMO-KEY-ONLY\n-----END OPENSSH PRIVATE KEY-----',
      allowedEmployees: team,
      nextRotationAt: healthy,
    },
    {
      name: 'ACME — Frontend — Production — .env',
      category: 'OTHER',
      credentialType: 'ENV_BUNDLE',
      criticality: 'MEDIUM',
      accessLevel: 'PROJECT_TEAM',
      projectId: ctx.products.acmeSite.projectId,
      ownerId: dev.id,
      provider: 'NBOS',
      envData: 'NEXT_PUBLIC_API_URL=https://api.acme.am\nAUTH_SECRET=***',
      allowedEmployees: team,
    },
    {
      name: 'TechStart — Firebase — Production',
      category: 'API_KEY',
      credentialType: 'API_KEY',
      criticality: 'HIGH',
      accessLevel: 'PROJECT_TEAM',
      projectId: ctx.products.techstartApp.projectId,
      productId: ctx.products.techstartApp.id,
      ownerId: pm.id,
      provider: 'Firebase',
      login: 'firebase@techstart.am',
      password: 'Firebase-Console-Demo-99',
      apiKey: 'AIzaSy-DEMO-TECHSTART-FIREBASE-KEY',
      allowedEmployees: team,
      nextRotationAt: dueSoon,
    },
    {
      name: 'TechStart — Apple Developer — Production',
      category: 'APP',
      credentialType: 'APP_STORE_ACCOUNT',
      criticality: 'CRITICAL',
      accessLevel: 'SECRET',
      projectId: ctx.products.techstartApp.projectId,
      productId: ctx.products.techstartApp.id,
      ownerId: pm.id,
      provider: 'Apple',
      login: 'dev@techstart.am',
      password: 'AppleDev-Portal-99',
      allowedEmployees: [pm.id],
      nextRotationAt: healthy,
    },
    {
      name: 'TechStart — Google Play Console',
      category: 'APP',
      credentialType: 'APP_STORE_ACCOUNT',
      criticality: 'HIGH',
      accessLevel: 'SECRET',
      projectId: ctx.products.techstartApp.projectId,
      ownerId: pm2.id,
      provider: 'Google Play',
      login: 'play@techstart.am',
      password: 'GPlay-Console-Demo',
      allowedEmployees: [pm2.id, dev.id],
    },
    {
      name: 'MedTech — WordPress — Admin',
      category: 'ADMIN',
      credentialType: 'LOGIN_PASSWORD',
      criticality: 'MEDIUM',
      accessLevel: 'PROJECT_TEAM',
      projectId: ctx.products.medtechBlog.projectId,
      productId: ctx.products.medtechBlog.id,
      ownerId: pm.id,
      provider: 'WordPress',
      url: 'https://blog.medtech.am/wp-admin',
      login: 'medtech_admin',
      password: 'Wp-Admin-MedTech-42',
      allowedEmployees: team,
    },
    {
      name: 'MedTech — SMTP — Transactional Mail',
      category: 'MAIL',
      credentialType: 'MAIL_SMTP',
      criticality: 'MEDIUM',
      accessLevel: 'DEPARTMENT',
      projectId: ctx.products.medtechBlog.projectId,
      ownerId: pm.id,
      provider: 'SendGrid',
      login: 'smtp@medtech.am',
      password: 'SG.smtp.demo.password',
    },
    {
      name: 'NBOS — OpenAI — Production API',
      category: 'API_KEY',
      credentialType: 'API_KEY',
      criticality: 'CRITICAL',
      accessLevel: 'SECRET',
      ownerId: ceo.id,
      provider: 'OpenAI',
      login: 'platform@neetrino.com',
      password: 'OpenAI-Portal-Demo-Pw',
      apiKey: 'sk-demo-openai-nbos-production-key',
      allowedEmployees: [ceo.id, pm.id],
      nextRotationAt: overdue,
    },
    {
      name: 'NBOS — Stripe — Finance Portal',
      category: 'ADMIN',
      credentialType: 'LOGIN_PASSWORD',
      criticality: 'CRITICAL',
      accessLevel: 'SECRET',
      ownerId: ceo.id,
      provider: 'Stripe',
      url: 'https://dashboard.stripe.com',
      login: 'finance@neetrino.com',
      password: 'Stripe-Dashboard-Demo',
      allowedEmployees: [ceo.id],
    },
    {
      name: 'Internal — Google Workspace — Admin',
      category: 'ADMIN',
      credentialType: 'LOGIN_PASSWORD',
      criticality: 'LOW',
      accessLevel: 'ALL',
      ownerId: ceo.id,
      provider: 'Google Workspace',
      login: 'admin@neetrino.com',
      password: 'Gw-Admin-Internal',
      nextRotationAt: healthy,
    } as CredentialSeedRow,
    {
      name: 'Internal — 2FA Recovery Codes — CEO',
      category: 'OTHER',
      credentialType: 'RECOVERY_CODES',
      criticality: 'CRITICAL',
      accessLevel: 'PERSONAL',
      ownerId: ceo.id,
      login: 'suren@neetrino.com',
      password: '2FA-Vault-Login-Demo',
      secureNotes: 'RC-01-ABCD\nRC-02-EFGH\nRC-03-IJKL',
      allowedEmployees: [ceo.id],
    },
    {
      name: 'PM Personal — Figma',
      category: 'SERVICE',
      credentialType: 'LOGIN_PASSWORD',
      criticality: 'LOW',
      accessLevel: 'PERSONAL',
      ownerId: pm.id,
      provider: 'Figma',
      url: 'https://figma.com',
      login: 'artur@neetrino.com',
      password: 'Figma-Personal-PM',
    },
    {
      name: 'Dev Personal — GitHub',
      category: 'SERVICE',
      credentialType: 'LOGIN_PASSWORD',
      criticality: 'LOW',
      accessLevel: 'PERSONAL',
      ownerId: dev.id,
      provider: 'GitHub',
      login: 'karen@neetrino.com',
      password: 'GitHub-Personal-Dev',
    },
    {
      name: 'Design — Adobe CC Team',
      category: 'SERVICE',
      credentialType: 'LOGIN_PASSWORD',
      criticality: 'MEDIUM',
      accessLevel: 'DEPARTMENT',
      ownerId: designer.id,
      provider: 'Adobe',
      login: 'design@neetrino.com',
      password: 'Adobe-Team-Demo',
    },
    {
      name: 'Sales — HubSpot (read-only shared)',
      category: 'SERVICE',
      credentialType: 'LOGIN_PASSWORD',
      criticality: 'MEDIUM',
      accessLevel: 'SECRET',
      ownerId: seller.id,
      provider: 'HubSpot',
      login: 'sales@neetrino.com',
      password: 'HubSpot-Sales-Demo',
      allowedEmployees: [seller.id, ceo.id],
    },
    {
      name: 'Legacy — Old Hosting Panel (archived)',
      category: 'HOSTING',
      credentialType: 'HOSTING_SERVER',
      criticality: 'MEDIUM',
      accessLevel: 'PROJECT_TEAM',
      projectId: ctx.products.acmeSite.projectId,
      ownerId: pm.id,
      provider: 'Beget',
      login: 'legacy_host',
      password: 'Old-Host-Archived',
      trashedAt: addUtcDays(now, -14),
    },
    {
      name: 'Legacy — Expired API Key (archived)',
      category: 'API_KEY',
      credentialType: 'API_KEY',
      criticality: 'LOW',
      accessLevel: 'SECRET',
      projectId: ctx.products.techstartApp.projectId,
      ownerId: dev.id,
      provider: 'LegacyMaps',
      login: 'maps@techstart.am',
      password: 'Legacy-Maps-Portal-Demo',
      apiKey: 'legacy-maps-key-revoked',
      allowedEmployees: [dev.id],
      trashedAt: addUtcDays(now, -45),
    },
  ];
}

function buildGeneratedRows(
  projects: Array<{ id: string; name: string; code: string }>,
  ctx: SeedCredentialsDemoContext,
  now: Date,
): CredentialSeedRow[] {
  const providers = ['Cloudflare', 'Beget', 'DigitalOcean', 'AWS', 'GitLab', 'Telegram', 'Slack'];
  const categories: CredentialCategoryEnum[] = [
    'ADMIN',
    'DOMAIN',
    'HOSTING',
    'SERVICE',
    'APP',
    'MAIL',
    'API_KEY',
    'DATABASE',
    'OTHER',
  ];
  const types: CredentialTypeEnum[] = [
    'LOGIN_PASSWORD',
    'API_KEY',
    'DATABASE',
    'HOSTING_SERVER',
    'DOMAIN_REGISTRAR',
    'MAIL_SMTP',
    'RECOVERY_CODES',
  ];
  const accessLevels: CredentialAccessLevelEnum[] = [
    'PROJECT_TEAM',
    'SECRET',
    'DEPARTMENT',
    'ALL',
    'PERSONAL',
  ];
  const criticalities: CredentialCriticalityEnum[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const rows: CredentialSeedRow[] = [];

  for (let i = 0; i < projects.length; i += 1) {
    const project = projects[i]!;
    for (let j = 0; j < 4; j += 1) {
      const idx = i * 4 + j;
      const category = categories[idx % categories.length]!;
      const credentialType = types[idx % types.length]!;
      const accessLevel = accessLevels[idx % accessLevels.length]!;
      const criticality = criticalities[idx % criticalities.length]!;
      const provider = providers[idx % providers.length]!;
      const rotationPhase = idx % 4;
      let nextRotationAt: Date | null | undefined;
      if (rotationPhase === 0) nextRotationAt = addUtcDays(now, -10);
      else if (rotationPhase === 1) nextRotationAt = addUtcDays(now, 7);
      else if (rotationPhase === 2) nextRotationAt = addUtcDays(now, 90);
      else nextRotationAt = null;

      const personalOwner =
        accessLevel === 'PERSONAL' ? personalOwnerForIndex(ctx, idx) : undefined;
      const secretAllowed = accessLevel === 'SECRET' ? secretAllowedEmployees(ctx, idx) : undefined;
      const ownerId =
        accessLevel === 'PERSONAL'
          ? personalOwner!.ownerId
          : idx % 2 === 0
            ? ctx.pm.id
            : ctx.pm2.id;

      rows.push(
        ensureDemoSecrets({
          name: `${project.code} — ${provider} — Demo #${j + 1}`,
          category,
          credentialType,
          criticality,
          accessLevel,
          projectId: project.id,
          ownerId: criticality === 'CRITICAL' && idx % 7 === 0 ? undefined : ownerId,
          provider,
          url: `https://${provider.toLowerCase()}.example.com/${project.code}`,
          login:
            accessLevel === 'PERSONAL'
              ? personalOwner!.login
              : `demo+${project.code.toLowerCase()}@${provider.toLowerCase()}.demo`,
          password: `pwd-${accessLevel.toLowerCase()}-${project.code}-${j}-demo`,
          apiKey:
            credentialType === 'API_KEY'
              ? `api-${accessLevel.toLowerCase()}-${project.code}-${idx}-demo-key`
              : undefined,
          allowedEmployees:
            accessLevel === 'SECRET'
              ? secretAllowed
              : accessLevel === 'PERSONAL'
                ? []
                : [ctx.pm.id, ctx.dev.id],
          nextRotationAt,
        }),
      );
    }
  }

  return rows;
}

async function createCredentialRows(
  prisma: PrismaClient,
  rows: CredentialSeedRow[],
  encKey: string,
  slugToProviderId: Map<string, string>,
): Promise<Map<string, string>> {
  const nameToId = new Map<string, string>();
  for (const row of rows) {
    const encrypted = encryptSecrets(ensureDemoSecrets(row), encKey);
    const providerId = await resolveCredentialProviderId(
      prisma,
      encrypted.provider,
      slugToProviderId,
    );
    const created = await prisma.credential.create({
      data: {
        name: encrypted.name,
        category: encrypted.category,
        credentialType: encrypted.credentialType,
        criticality: encrypted.criticality,
        accessLevel: encrypted.accessLevel,
        projectId: encrypted.projectId,
        productId: encrypted.productId,
        domainId: encrypted.domainId,
        clientServiceRecordId: encrypted.clientServiceRecordId,
        ownerId: encrypted.ownerId,
        rotationOwnerId: encrypted.rotationOwnerId,
        providerId,
        url: encrypted.url,
        login: encrypted.login,
        phone: encrypted.phone,
        password: encrypted.password,
        apiKey: encrypted.apiKey,
        envData: encrypted.envData,
        secureNotes: encrypted.secureNotes,
        publicNotes: encrypted.publicNotes,
        notes: encrypted.publicNotes,
        allowedEmployees: encrypted.allowedEmployees ?? [],
        lastRotatedAt: encrypted.lastRotatedAt,
        nextRotationAt: encrypted.nextRotationAt,
        trashedAt: encrypted.trashedAt,
      },
    });
    nameToId.set(row.name, created.id);
  }
  return nameToId;
}

async function linkDomainsAndClientServices(
  prisma: PrismaClient,
  nameToId: Map<string, string>,
): Promise<void> {
  const domainLinks: Array<[string, string]> = [
    ['ACME — Namecheap — Production — DNS', 'acme.am'],
    ['MedTech — WordPress — Admin', 'medtech-portal.am'],
  ];
  for (const [credName, domainName] of domainLinks) {
    const credId = nameToId.get(credName);
    const domain = await prisma.domain.findUnique({ where: { domainName } });
    if (credId && domain) {
      await prisma.credential.update({ where: { id: credId }, data: { domainId: domain.id } });
    }
  }

  const services = await prisma.clientServiceRecord.findMany({
    take: 8,
    orderBy: { createdAt: 'asc' },
    select: { id: true, projectId: true },
  });
  const linkNames = [...nameToId.keys()]
    .filter((n) => n.includes('Demo #1'))
    .slice(0, services.length);
  for (let i = 0; i < linkNames.length && i < services.length; i += 1) {
    const credId = nameToId.get(linkNames[i]!);
    const service = services[i]!;
    if (credId) {
      await prisma.credential.update({
        where: { id: credId },
        data: { clientServiceRecordId: service.id, projectId: service.projectId },
      });
    }
  }
}

async function seedProductAccessSlotBindings(
  prisma: PrismaClient,
  ctx: SeedCredentialsDemoContext,
  nameToId: Map<string, string>,
): Promise<number> {
  const bindings: ProductSlotBinding[] = [
    {
      productId: ctx.products.acmeSite.id,
      slotKey: 'HOSTING',
      credentialName: 'ACME — Vercel — Production — Deployment',
    },
    {
      productId: ctx.products.acmeSite.id,
      slotKey: 'DOMAIN',
      credentialName: 'ACME — Namecheap — Production — DNS',
    },
    {
      productId: ctx.products.acmeSite.id,
      slotKey: 'DATABASE',
      credentialName: 'ACME — Neon — Production — Database',
    },
    {
      productId: ctx.products.techstartApp.id,
      slotKey: 'APP_STORE',
      credentialName: 'TechStart — Apple Developer — Production',
    },
    {
      productId: ctx.products.techstartApp.id,
      slotKey: 'API_INTEGRATION',
      credentialName: 'TechStart — Firebase — Production',
    },
    {
      productId: ctx.products.medtechBlog.id,
      slotKey: 'ADMIN',
      credentialName: 'MedTech — WordPress — Admin',
    },
    {
      productId: ctx.products.medtechBlog.id,
      slotKey: 'MAIL',
      credentialName: 'MedTech — SMTP — Transactional Mail',
    },
  ];

  let count = 0;
  for (const binding of bindings) {
    const credentialId = nameToId.get(binding.credentialName);
    if (!credentialId) continue;
    await prisma.productAccessSlotBinding.create({
      data: {
        productId: binding.productId,
        slotKey: binding.slotKey,
        credentialId,
      },
    });
    await prisma.credential.update({
      where: { id: credentialId },
      data: { productId: binding.productId },
    });
    count += 1;
  }
  return count;
}

/** Rich credentials dataset for vault QA (~120+ rows). */
export async function seedCredentialsDemo(
  prisma: PrismaClient,
  ctx: SeedCredentialsDemoContext,
): Promise<void> {
  const encKey = resolveEncryptionKey();
  const now = new Date();

  const projects = await prisma.project.findMany({
    select: { id: true, name: true, code: true },
    orderBy: { code: 'asc' },
  });

  const slugToProviderId = await seedCredentialProviders(prisma);

  const showcase = buildShowcaseRows(ctx, now).map(ensureDemoSecrets);
  const generated = buildGeneratedRows(projects, ctx, now);
  const allRows = [...showcase, ...generated];

  const nameToId = await createCredentialRows(prisma, allRows, encKey, slugToProviderId);
  await linkDomainsAndClientServices(prisma, nameToId);
  const bindingCount = await seedProductAccessSlotBindings(prisma, ctx, nameToId);

  const archivedCount = allRows.filter((r) => r.trashedAt).length;
  console.log(
    `  ✓ Credentials demo (${allRows.length} total, ${archivedCount} archived, ${bindingCount} product slot bindings)`,
  );
}
