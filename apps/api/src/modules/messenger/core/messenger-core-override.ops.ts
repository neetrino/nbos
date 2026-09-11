import { NotFoundException } from '@nestjs/common';
import { PrismaClient, type PlatformAccessActionEnum } from '@nbos/database';
import { RESOURCE_GRANT_RESOURCE_TYPE } from '@nbos/shared';
import { activeResourceAccessGrantWhere } from '../../credentials/credential-active-grant.where';
import {
  bumpGlobalConversationRevision,
  bumpTargetedAccessRemovedRevision,
} from './messenger-core-revision-write.ops';
import { runMessengerWriteTx } from './messenger-core-revision-tx';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function grantMessengerConversationOverride(
  prisma: PrismaLike,
  input: {
    conversationId: string;
    employeeId: string;
    level: PlatformAccessActionEnum;
    grantedById: string;
    reason?: string;
  },
): Promise<{ id: string; level: PlatformAccessActionEnum }> {
  const conversation = await requireConversationZone(prisma, input.conversationId);
  return runMessengerWriteTx(prisma, async (tx) => {
    const row = await tx.resourceAccessGrant.upsert({
      where: {
        resourceType_resourceId_employeeId: {
          resourceType: RESOURCE_GRANT_RESOURCE_TYPE.MESSENGER_CONVERSATION,
          resourceId: input.conversationId,
          employeeId: input.employeeId,
        },
      },
      create: {
        resourceType: RESOURCE_GRANT_RESOURCE_TYPE.MESSENGER_CONVERSATION,
        resourceId: input.conversationId,
        employeeId: input.employeeId,
        level: input.level,
        grantedById: input.grantedById,
        reason: input.reason,
        revokedAt: null,
      },
      update: {
        level: input.level,
        grantedById: input.grantedById,
        reason: input.reason,
        revokedAt: null,
        expiresAt: null,
      },
      select: { id: true, level: true },
    });
    await bumpGlobalConversationRevision(tx, conversation.zone, input.conversationId);
    return row;
  });
}

export async function revokeMessengerConversationOverride(
  prisma: PrismaLike,
  conversationId: string,
  employeeId: string,
): Promise<{ revoked: boolean }> {
  const conversation = await requireConversationZone(prisma, conversationId);
  return runMessengerWriteTx(prisma, async (tx) => {
    const result = await tx.resourceAccessGrant.updateMany({
      where: {
        resourceType: RESOURCE_GRANT_RESOURCE_TYPE.MESSENGER_CONVERSATION,
        resourceId: conversationId,
        employeeId,
        ...activeResourceAccessGrantWhere(),
      },
      data: { revokedAt: new Date() },
    });
    if (result.count > 0) {
      await bumpTargetedAccessRemovedRevision(tx, conversation.zone, employeeId, conversationId);
    }
    return { revoked: result.count > 0 };
  });
}

async function requireConversationZone(
  prisma: PrismaLike,
  conversationId: string,
): Promise<{ zone: 'INTERNAL' | 'CLIENT' }> {
  const conversation = await prisma.messengerConversation.findUnique({
    where: { id: conversationId },
    select: { zone: true },
  });
  if (!conversation) throw new NotFoundException('Conversation not found');
  return conversation;
}
