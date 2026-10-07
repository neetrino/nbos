import { Logger } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { WHATSAPP_FALLBACK_ACCOUNT_ID } from './product-communication.constants';

type PrismaLike = InstanceType<typeof PrismaClient>;

const logger = new Logger('WhatsAppGatewayAccount');

export const WHATSAPP_ALLOW_LEGACY_DEFAULT_ACCOUNT_ENV = 'WHATSAPP_ALLOW_LEGACY_DEFAULT_ACCOUNT';

export class WhatsAppGatewayAccountNotConfiguredError extends Error {
  constructor() {
    super(
      'WhatsApp Gateway account id is not configured. Set WhatsAppGatewayConnection.gatewayAccountId.',
    );
    this.name = 'WhatsAppGatewayAccountNotConfiguredError';
  }
}

/** Production never sends through the legacy `default` account, even if this flag is set. */
export function allowsLegacyWhatsAppDefaultAccount(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NODE_ENV === 'production') {
    if (env[WHATSAPP_ALLOW_LEGACY_DEFAULT_ACCOUNT_ENV]?.trim().toLowerCase() === 'true') {
      logger.error('whatsapp_legacy_default_flag_ignored');
    }
    return false;
  }
  return true;
}

export async function resolveWhatsAppGatewayAccountId(
  prisma: PrismaLike,
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  const row = await prisma.whatsAppGatewayConnection.findFirst({
    select: { gatewayAccountId: true },
  });
  const trimmed = row?.gatewayAccountId?.trim() ?? '';
  if (trimmed.length > 0 && trimmed !== WHATSAPP_FALLBACK_ACCOUNT_ID) return trimmed;
  if (allowsLegacyWhatsAppDefaultAccount(env)) return WHATSAPP_FALLBACK_ACCOUNT_ID;
  logger.error('whatsapp_invalid_default_account');
  throw new WhatsAppGatewayAccountNotConfiguredError();
}

export async function resolveWhatsAppAccountantGroupChatId(
  prisma: PrismaLike,
): Promise<string | null> {
  const row = await prisma.whatsAppGatewayConnection.findFirst({
    select: { accountingGroupChatId: true },
  });
  const trimmed = row?.accountingGroupChatId?.trim();
  return trimmed || null;
}
