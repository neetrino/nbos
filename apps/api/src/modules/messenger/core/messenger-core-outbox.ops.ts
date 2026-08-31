import { ForbiddenException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { MESSENGER_CORE_INTERNAL_OUTBOX_FORBIDDEN } from './messenger-core.constants';
import { isInternalZone } from './messenger-core-zone';

type PrismaLike = InstanceType<typeof PrismaClient>;

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
  return prisma.messengerCommand.upsert({
    where: { idempotencyKey: input.idempotencyKey },
    create: {
      idempotencyKey: input.idempotencyKey,
      conversationId: conversation.id,
      resultMessageId: input.messageId,
      kind: 'SEND_MESSAGE',
      status: 'PENDING',
      actorEmployeeId: input.createdById,
      payload: input.payload,
    },
    update: {},
    select: { id: true, status: true },
  });
}
