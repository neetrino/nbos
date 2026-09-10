import { ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import {
  MESSENGER_CORE_COMMAND_CONFLICT,
  MESSENGER_CORE_INTERNAL_OUTBOX_FORBIDDEN,
} from './messenger-core.constants';
import {
  parseWhatsAppSendCommandPayload,
  whatsAppSendCommandPayloadsMatch,
  type WhatsAppSendCommandPayload,
} from './messenger-core-command-payload';
import { isInternalZone } from './messenger-core-zone';
import { MESSENGER_AUDIT_EXTERNAL_SEND_INTENDED } from './messenger-outbound-audit';
import { writeMessengerExternalSendAudit } from './messenger-outbound-audit';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type EnsureWhatsAppSendCommandInput = {
  conversationId: string;
  messageId: string;
  idempotencyKey: string;
  payload: WhatsAppSendCommandPayload;
  createdById?: string;
  allowCreate: boolean;
};

/** Core idempotency hook for later provider side effects. Does not dispatch Gateway. */
export async function createCoreProviderSendOutbox(
  prisma: PrismaLike,
  input: {
    conversationId: string;
    messageId?: string;
    idempotencyKey: string;
    createdById?: string;
    payload?: InputJsonValue;
  },
): Promise<{ id: string; status: string }> {
  const conversation = await prisma.messengerConversation.findUniqueOrThrow({
    where: { id: input.conversationId },
    select: { id: true, zone: true },
  });
  if (isInternalZone(conversation.zone)) {
    throw new ForbiddenException(MESSENGER_CORE_INTERNAL_OUTBOX_FORBIDDEN);
  }
  const parsed = parseWhatsAppSendCommandPayload(input.payload);
  if (!parsed || !input.messageId) {
    throw new ConflictException(MESSENGER_CORE_COMMAND_CONFLICT);
  }
  const row = await ensureWhatsAppSendCommand(prisma, {
    conversationId: conversation.id,
    messageId: input.messageId,
    idempotencyKey: input.idempotencyKey,
    payload: parsed,
    createdById: input.createdById,
    allowCreate: true,
  });
  if (!row) throw new ConflictException(MESSENGER_CORE_COMMAND_CONFLICT);
  return row;
}

export async function ensureWhatsAppSendCommand(
  prisma: PrismaLike,
  input: EnsureWhatsAppSendCommandInput,
): Promise<{ id: string; status: string } | null> {
  const existing = await prisma.messengerCommand.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    select: commandIdentitySelect,
  });
  if (existing) {
    assertExistingWhatsAppSendCommand(existing, input);
    return { id: existing.id, status: existing.status };
  }
  if (!input.allowCreate) return null;
  const inserted = await prisma.messengerCommand.createMany({
    data: [
      {
        idempotencyKey: input.idempotencyKey,
        conversationId: input.conversationId,
        resultMessageId: input.messageId,
        kind: 'SEND_MESSAGE',
        status: 'PENDING',
        actorEmployeeId: input.createdById,
        payload: input.payload,
      },
    ],
    skipDuplicates: true,
  });
  const row = await prisma.messengerCommand.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    select: commandIdentitySelect,
  });
  if (!row) throw new ConflictException(MESSENGER_CORE_COMMAND_CONFLICT);
  assertExistingWhatsAppSendCommand(row, input);
  if (inserted.count === 1) {
    await writeMessengerExternalSendAudit(prisma, {
      messageId: input.messageId,
      conversationId: input.conversationId,
      action: MESSENGER_AUDIT_EXTERNAL_SEND_INTENDED,
      userId: input.createdById,
      commandStatus: 'PENDING',
      messageStatus: 'QUEUED',
    });
  }
  return { id: row.id, status: row.status };
}

const commandIdentitySelect = {
  id: true,
  status: true,
  conversationId: true,
  resultMessageId: true,
  kind: true,
  payload: true,
} as const;

function assertExistingWhatsAppSendCommand(
  existing: {
    conversationId: string | null;
    resultMessageId: string | null;
    kind: string;
    payload: unknown;
  },
  input: EnsureWhatsAppSendCommandInput,
): void {
  const matches =
    existing.conversationId === input.conversationId &&
    existing.resultMessageId === input.messageId &&
    existing.kind === 'SEND_MESSAGE' &&
    commandPayloadIdentityMatches(existing.payload, input.payload);
  if (!matches) {
    throw new ConflictException(MESSENGER_CORE_COMMAND_CONFLICT);
  }
}

function commandPayloadIdentityMatches(left: unknown, right: WhatsAppSendCommandPayload): boolean {
  const parsed = parseWhatsAppSendCommandPayload(left);
  if (parsed) return whatsAppSendCommandPayloadsMatch(parsed, right);
  if (!left || typeof left !== 'object' || Array.isArray(left)) return false;
  const record = left as Record<string, unknown>;
  return record.accountId === right.accountId && record.chatId === right.chatId;
}
