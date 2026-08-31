import { PrismaClient, type MessengerMessageStatus } from '@nbos/database';
import { mapCoreMessage } from './messenger-core-message-map';
import type { MessengerCoreMessageDto } from './messenger-core.types';
import {
  canAdvanceWhatsAppDelivery,
  mapWhatsAppAckToStatus,
  WHATSAPP_LIFECYCLE_MESSAGE_NOT_FOUND,
  whatsAppStatusesStrictlyBelow,
} from './messenger-wa-identity';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type WhatsAppLifecycleResult = {
  message: MessengerCoreMessageDto | null;
  skipped: boolean;
  skipReason: string | null;
};

export async function applyWhatsAppAck(
  prisma: PrismaLike,
  input: { accountId: string; providerMessageId: string; ack: unknown },
): Promise<WhatsAppLifecycleResult> {
  const next = mapWhatsAppAckToStatus(input.ack);
  const found = await findWhatsAppRefMessage(prisma, input.accountId, input.providerMessageId);
  if (!found || !next) {
    return {
      message: null,
      skipped: true,
      skipReason: next ? WHATSAPP_LIFECYCLE_MESSAGE_NOT_FOUND : 'UNKNOWN_ACK',
    };
  }
  if (!canAdvanceWhatsAppDelivery(found.status, next)) {
    return { message: mapCoreMessage(found), skipped: true, skipReason: 'ACK_NOT_ADVANCED' };
  }
  const advanced = await prisma.messengerMessage.updateMany({
    where: { id: found.id, status: { in: whatsAppStatusesStrictlyBelow(next) } },
    data: { status: next },
  });
  if (advanced.count === 0) {
    const current = await reloadLifecycleMessage(prisma, found.id);
    return {
      message: current ? mapCoreMessage(current) : mapCoreMessage(found),
      skipped: true,
      skipReason: 'ACK_NOT_ADVANCED',
    };
  }
  const updated = await reloadLifecycleMessage(prisma, found.id);
  if (!updated) {
    return {
      message: mapCoreMessage(found),
      skipped: true,
      skipReason: WHATSAPP_LIFECYCLE_MESSAGE_NOT_FOUND,
    };
  }
  return { message: mapCoreMessage(updated), skipped: false, skipReason: null };
}

export async function applyWhatsAppEdit(
  prisma: PrismaLike,
  input: { accountId: string; providerMessageId: string; body: string; editedAt: Date },
): Promise<WhatsAppLifecycleResult> {
  const found = await findWhatsAppRefMessage(prisma, input.accountId, input.providerMessageId);
  if (!found) {
    return { message: null, skipped: true, skipReason: WHATSAPP_LIFECYCLE_MESSAGE_NOT_FOUND };
  }
  const updated = await prisma.messengerMessage.update({
    where: { id: found.id },
    data: { content: input.body, editedAt: input.editedAt },
    include: { attachments: true, mentions: true, referencesAsTarget: true },
  });
  return { message: mapCoreMessage(updated), skipped: false, skipReason: null };
}

export async function applyWhatsAppRevoke(
  prisma: PrismaLike,
  input: { accountId: string; providerMessageId: string; revokedAt: Date },
): Promise<WhatsAppLifecycleResult> {
  const found = await findWhatsAppRefMessage(prisma, input.accountId, input.providerMessageId);
  if (!found) {
    return { message: null, skipped: true, skipReason: WHATSAPP_LIFECYCLE_MESSAGE_NOT_FOUND };
  }
  const updated = await prisma.messengerMessage.update({
    where: { id: found.id },
    data: { deletedAt: input.revokedAt },
    include: { attachments: true, mentions: true, referencesAsTarget: true },
  });
  return { message: mapCoreMessage(updated), skipped: false, skipReason: null };
}

export async function applyWhatsAppReactionEvent(): Promise<WhatsAppLifecycleResult> {
  return { message: null, skipped: true, skipReason: 'PROVIDER_REACTION_NO_EMPLOYEE' };
}

const LIFECYCLE_INCLUDE = {
  attachments: true,
  mentions: true,
  referencesAsTarget: true,
} as const;

async function findWhatsAppRefMessage(
  prisma: PrismaLike,
  accountId: string,
  providerMessageId: string,
) {
  const ref = await prisma.messengerMessageExternalRef.findUnique({
    where: {
      provider_externalAccountId_externalMessageId: {
        provider: 'WHATSAPP',
        externalAccountId: accountId,
        externalMessageId: providerMessageId,
      },
    },
    select: { messageId: true },
  });
  if (!ref) return null;
  return reloadLifecycleMessage(prisma, ref.messageId);
}

async function reloadLifecycleMessage(prisma: PrismaLike, messageId: string) {
  return prisma.messengerMessage.findUnique({
    where: { id: messageId },
    include: LIFECYCLE_INCLUDE,
  });
}

export type WhatsAppRefMessageStatus = MessengerMessageStatus;
