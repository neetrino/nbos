import type { PrismaClient } from '@nbos/database';
import { WHATSAPP_FALLBACK_ACCOUNT_ID } from './product-communication.constants';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function resolveWhatsAppGatewayAccountId(prisma: PrismaLike): Promise<string> {
  const row = await prisma.whatsAppGatewayConnection.findFirst({
    select: { gatewayAccountId: true },
  });
  const trimmed = row?.gatewayAccountId?.trim();
  return trimmed || WHATSAPP_FALLBACK_ACCOUNT_ID;
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
