import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { CreateMessengerCoreReferenceInput } from './messenger-core.types';
import {
  MESSENGER_CORE_FORWARD_CLIENT_TARGET_FORBIDDEN,
  MESSENGER_CORE_FORWARD_REQUIRES_INTERNAL_TARGET,
} from './messenger-core.constants';
import { isInternalZone } from './messenger-core-zone';

type AccessGate = (conversationId: string) => Promise<{
  facts: { zone: 'INTERNAL' | 'CLIENT' };
}>;

export async function assertReferenceConversations(
  prisma: InstanceType<typeof PrismaClient>,
  input: CreateMessengerCoreReferenceInput,
  requireRead: AccessGate,
  requireWrite: AccessGate,
): Promise<void> {
  const source = await prisma.messengerMessage.findUnique({
    where: { id: input.sourceMessageId },
    select: { conversationId: true },
  });
  if (!source) throw new NotFoundException('Source message not found');
  await requireRead(source.conversationId);
  const holderId = input.targetMessageId ?? input.referencedByMessageId;
  if (!holderId) {
    if (input.purpose === 'FORWARD') {
      throw new BadRequestException('Forward references require a holder message');
    }
    return;
  }
  const holder = await prisma.messengerMessage.findUnique({
    where: { id: holderId },
    select: { conversationId: true },
  });
  if (!holder) throw new NotFoundException('Conversation not found');
  if (input.purpose === 'FORWARD') {
    const target = await requireWrite(holder.conversationId);
    assertForwardTargetZone(target.facts.zone);
    return;
  }
  if (holder.conversationId === source.conversationId) return;
  await requireRead(holder.conversationId);
}

export function assertForwardTargetZone(zone: 'INTERNAL' | 'CLIENT'): void {
  if (isInternalZone(zone)) return;
  throw new ForbiddenException(
    zone === 'CLIENT'
      ? MESSENGER_CORE_FORWARD_CLIENT_TARGET_FORBIDDEN
      : MESSENGER_CORE_FORWARD_REQUIRES_INTERNAL_TARGET,
  );
}
