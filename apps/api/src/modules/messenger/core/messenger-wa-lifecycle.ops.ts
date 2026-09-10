import { PrismaClient, type MessengerMessageStatus } from '@nbos/database';
import { mapCoreMessage } from './messenger-core-message-map';
import { runMessengerWriteTx } from './messenger-core-revision-tx';
import type { MessengerCoreMessageDto } from './messenger-core.types';
import { messengerGatewayAuditActor } from './messenger-outbound-audit';
import { isWhatsAppProofMessageStatus } from './messenger-outbound-command-claim';
import {
  lockCanonicalWhatsAppCommand,
  lockedCommandMatchesResolvedMessage,
} from './messenger-outbound-command-lock';
import { completeLockedCommand } from './messenger-outbound-outcome-reducer';
import {
  mapWhatsAppAckToStatus,
  whatsAppOutboundIdempotencyKey,
  whatsAppStatusesAllowedForOwnedProofWrite,
  WHATSAPP_LIFECYCLE_MESSAGE_NOT_FOUND,
} from './messenger-wa-identity';
import { casOwnedProofStatus } from './messenger-wa-outbound-cas';

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
  const messageChanged = await runMessengerWriteTx(prisma, (tx) =>
    persistWhatsAppAckProof(tx, found, next),
  );
  const current = (await reloadLifecycleMessage(prisma, found.id)) ?? found;
  if (!messageChanged) {
    return { message: mapCoreMessage(current), skipped: true, skipReason: 'ACK_NOT_ADVANCED' };
  }
  return { message: mapCoreMessage(current), skipped: false, skipReason: null };
}

async function persistWhatsAppAckProof(
  prisma: PrismaLike,
  found: { id: string; conversationId: string; status: MessengerMessageStatus },
  next: MessengerMessageStatus,
): Promise<boolean> {
  const live = await lockCanonicalWhatsAppCommand(prisma, {
    idempotencyKey: whatsAppOutboundIdempotencyKey(found.id),
  });
  const row = await prisma.messengerMessage.findUnique({
    where: { id: found.id },
    select: { status: true },
  });
  const from = row?.status ?? found.status;
  const allowed = whatsAppStatusesAllowedForOwnedProofWrite(next);
  const messageChanged =
    allowed.includes(from) && (await casOwnedProofStatus(prisma, found.id, next));
  const after = messageChanged ? next : from;
  const commandMatched =
    live != null &&
    lockedCommandMatchesResolvedMessage(live, {
      messageId: found.id,
      conversationId: found.conversationId,
    });
  if (commandMatched && (isWhatsAppProofMessageStatus(after) || after === 'CANCELLED')) {
    await completeLockedCommand(
      prisma,
      live,
      { messageId: found.id, conversationId: found.conversationId },
      messengerGatewayAuditActor(),
      messageChanged ? next : undefined,
    );
  }
  return messageChanged;
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
