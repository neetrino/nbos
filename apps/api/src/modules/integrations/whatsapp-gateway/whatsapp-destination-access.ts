import type { PrismaClient } from '@nbos/database';
import { decrypt } from '../../../common/utils/crypto';
import { WhatsAppGatewayClient, type WhatsAppGatewayClientConfig } from './whatsapp-gateway.client';
import { WhatsAppGatewayHttpError } from './whatsapp-gateway.errors';

type PrismaLike = InstanceType<typeof PrismaClient>;

const MISSING_GROUP_CODES = new Set(['GROUP_NOT_FOUND', 'INVALID_GROUP_ID', 'HTTP_404']);

export type WhatsAppDestinationVerdict = 'accessible' | 'missing' | 'unavailable';

export type WhatsAppGroupAccessProbe = (chatId: string) => Promise<WhatsAppDestinationVerdict>;

type GroupLookup = {
  getGroup(config: WhatsAppGatewayClientConfig, groupId: string): Promise<{ id?: string | null }>;
};

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
  return (chatId) => probeWhatsAppGroupAccess(client, config, chatId);
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
