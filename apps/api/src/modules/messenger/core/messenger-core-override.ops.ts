import { NotFoundException } from '@nestjs/common';
import { PrismaClient, type PlatformAccessActionEnum } from '@nbos/database';
import { RESOURCE_GRANT_RESOURCE_TYPE } from '@nbos/shared';
import { activeResourceAccessGrantWhere } from '../../credentials/credential-active-grant.where';

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
  const conversation = await prisma.messengerConversation.findUnique({
    where: { id: input.conversationId },
    select: { id: true },
  });
  if (!conversation) throw new NotFoundException('Conversation not found');
  const row = await prisma.resourceAccessGrant.upsert({
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
  return row;
}

export async function revokeMessengerConversationOverride(
  prisma: PrismaLike,
  conversationId: string,
  employeeId: string,
): Promise<{ revoked: boolean }> {
  const result = await prisma.resourceAccessGrant.updateMany({
    where: {
      resourceType: RESOURCE_GRANT_RESOURCE_TYPE.MESSENGER_CONVERSATION,
      resourceId: conversationId,
      employeeId,
      ...activeResourceAccessGrantWhere(),
    },
    data: { revokedAt: new Date() },
  });
  return { revoked: result.count > 0 };
}
