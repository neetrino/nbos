import type { PrismaClient } from '@nbos/database';
import { decrypt } from '../../../common/utils/crypto';
import {
  classifyLegacyGroupAccount,
  type WhatsAppGatewayAccountSummary,
} from './whatsapp-gateway-account';
import { WhatsAppGatewayClient, type WhatsAppGatewayClientConfig } from './whatsapp-gateway.client';
import { WhatsAppGatewayHttpError } from './whatsapp-gateway.errors';

type PrismaLike = InstanceType<typeof PrismaClient>;

const MISSING_GROUP_CODES = new Set(['GROUP_NOT_FOUND', 'INVALID_GROUP_ID', 'HTTP_404']);

export type WhatsAppDestinationVerdict =
  | 'accessible'
  | 'missing'
  | 'unavailable'
  | 'account_mismatch'
  | 'account_unknown';

export type WhatsAppGroupAccessProbe = (
  chatId: string,
  targetAccountId: string,
) => Promise<WhatsAppDestinationVerdict>;

type GroupLookup = {
  getGroup(config: WhatsAppGatewayClientConfig, groupId: string): Promise<{ id?: string | null }>;
};

type AccountGroupLookup = GroupLookup & {
  listAccounts(config: WhatsAppGatewayClientConfig): Promise<WhatsAppGatewayAccountSummary[]>;
};

/**
 * Proves `targetAccountId` is the single CONNECTED account that serves legacy
 * `GET /api/groups`, then confirms that session can see the group.
 */
export async function probeWhatsAppGroupForAccount(
  client: AccountGroupLookup,
  config: WhatsAppGatewayClientConfig,
  chatId: string,
  targetAccountId: string,
): Promise<WhatsAppDestinationVerdict> {
  const identity = await readLegacyGroupAccount(client, config, targetAccountId);
  if (identity !== 'match') return identity === 'mismatch' ? 'account_mismatch' : 'account_unknown';
  return probeWhatsAppGroupAccess(client, config, chatId);
}

/**
 * Confirms the connected Gateway account can see this group.
 * Timeouts, 5xx, and mismatched ids are unavailable, not accessible.
 */
export async function probeWhatsAppGroupAccess(
  client: GroupLookup,
  config: WhatsAppGatewayClientConfig,
  chatId: string,
): Promise<WhatsAppDestinationVerdict> {
  if (!chatId.endsWith('@g.us')) return 'unavailable';
  try {
    const group = await client.getGroup(config, chatId);
    if (!group?.id || group.id !== chatId) return 'unavailable';
    return 'accessible';
  } catch (error) {
    return classifyWhatsAppGroupProbeError(error);
  }
}

export function classifyWhatsAppGroupProbeError(error: unknown): 'missing' | 'unavailable' {
  if (!(error instanceof WhatsAppGatewayHttpError)) return 'unavailable';
  if (error.status === 404 || MISSING_GROUP_CODES.has(error.code)) return 'missing';
  return 'unavailable';
}

/** Read-only. A missing key, row, or token yields a probe that never reports accessible. */
export async function createWhatsAppGroupProbe(
  prisma: PrismaLike,
): Promise<WhatsAppGroupAccessProbe> {
  const config = await readGatewayProbeConfig(prisma);
  if (!config) return async () => 'unavailable';
  const client = new WhatsAppGatewayClient();
  return (chatId, targetAccountId) =>
    probeWhatsAppGroupForAccount(client, config, chatId, targetAccountId);
}

async function readLegacyGroupAccount(
  client: AccountGroupLookup,
  config: WhatsAppGatewayClientConfig,
  targetAccountId: string,
): Promise<'match' | 'mismatch' | 'unknown'> {
  try {
    const accounts = await client.listAccounts(config);
    return classifyLegacyGroupAccount(accounts, targetAccountId);
  } catch {
    return 'unknown';
  }
}

async function readGatewayProbeConfig(
  prisma: PrismaLike,
): Promise<WhatsAppGatewayClientConfig | null> {
  const key = process.env.CREDENTIALS_ENCRYPTION_KEY?.trim();
  if (!key) return null;
  const row = await prisma.whatsAppGatewayConnection.findFirst({
    select: { baseUrl: true, encryptedApiToken: true },
  });
  if (!row?.baseUrl || !row.encryptedApiToken) return null;
  try {
    return { baseUrl: row.baseUrl, apiToken: decrypt(row.encryptedApiToken, key) };
  } catch {
    return null;
  }
}
