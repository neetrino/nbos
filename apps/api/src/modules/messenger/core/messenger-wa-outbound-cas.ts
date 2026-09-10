import type { MessengerMessageStatus, PrismaClient } from '@nbos/database';
import {
  whatsAppStatusesAllowedForOutboundWrite,
  whatsAppStatusesAllowedForOwnedProofWrite,
  type WhatsAppOutboundCasStatus,
} from './messenger-wa-identity';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function casOutboundStatus(
  prisma: PrismaLike,
  messageId: string,
  status: WhatsAppOutboundCasStatus,
): Promise<boolean> {
  const result = await prisma.messengerMessage.updateMany({
    where: { id: messageId, status: { in: whatsAppStatusesAllowedForOutboundWrite(status) } },
    data: { status },
  });
  return result.count > 0;
}

export async function casOwnedProofStatus(
  prisma: PrismaLike,
  messageId: string,
  status: MessengerMessageStatus,
): Promise<boolean> {
  const allowed = whatsAppStatusesAllowedForOwnedProofWrite(status);
  if (allowed.length === 0) return false;
  const result = await prisma.messengerMessage.updateMany({
    where: { id: messageId, status: { in: allowed } },
    data: { status },
  });
  return result.count > 0;
}
