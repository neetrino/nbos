import { BadRequestException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import {
  MESSENGER_ATTENTION_OWNER_EMPLOYEE,
  MESSENGER_ATTENTION_OWNER_QUEUE,
  MESSENGER_ATTENTION_OWNER_ROLE,
  MESSENGER_ATTENTION_QUEUE_FINANCE,
  MESSENGER_ATTENTION_QUEUE_SUPPORT_INTAKE,
} from './messenger-core-attention.constants';
import { loadAssignedQueueEmployeeIds } from './messenger-core-attention-queue.ops';
import type { MessengerAttentionDto } from './messenger-core-attention.types';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type AttentionOwnerInput = {
  conversationId: string;
  ownerKind: MessengerAttentionDto['ownerKind'];
  ownerEmployeeId?: string | null;
  ownerQueue?: MessengerAttentionDto['ownerQueue'];
};

export async function assertAttentionOwnerAllowed(
  prisma: PrismaLike,
  input: AttentionOwnerInput,
): Promise<void> {
  if (input.ownerKind === MESSENGER_ATTENTION_OWNER_QUEUE) {
    assertKnownQueue(input.ownerQueue);
    return;
  }
  if (input.ownerKind === MESSENGER_ATTENTION_OWNER_ROLE) {
    return;
  }
  if (input.ownerKind !== MESSENGER_ATTENTION_OWNER_EMPLOYEE) {
    throw new BadRequestException('Attention ownerKind must be QUEUE, ROLE, or EMPLOYEE');
  }
  await assertEmployeeOwnerAllowed(prisma, input.conversationId, input.ownerEmployeeId);
}

function assertKnownQueue(ownerQueue: AttentionOwnerInput['ownerQueue']): void {
  if (
    ownerQueue !== MESSENGER_ATTENTION_QUEUE_SUPPORT_INTAKE &&
    ownerQueue !== MESSENGER_ATTENTION_QUEUE_FINANCE
  ) {
    throw new BadRequestException('Queue attention requires Support Intake or Finance');
  }
}

async function assertEmployeeOwnerAllowed(
  prisma: PrismaLike,
  conversationId: string,
  ownerEmployeeId: string | null | undefined,
): Promise<void> {
  const employeeId = ownerEmployeeId?.trim() || '';
  if (!employeeId) {
    throw new BadRequestException('Employee attention requires ownerEmployeeId');
  }
  const participant = await prisma.messengerConversationParticipant.findFirst({
    where: { conversationId, employeeId, leftAt: null },
    select: { employeeId: true },
  });
  if (participant) return;
  const queueIds = await loadAssignedQueueEmployeeIds(prisma);
  if (queueIds.has(employeeId)) return;
  throw new BadRequestException(
    'Employee attention owner must be a conversation participant or queue member',
  );
}
