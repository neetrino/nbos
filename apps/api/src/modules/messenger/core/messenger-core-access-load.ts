import type { PrismaClient } from '@nbos/database';
import { RESOURCE_GRANT_RESOURCE_TYPE } from '@nbos/shared';
import { activeResourceAccessGrantWhere } from '../../credentials/credential-active-grant.where';
import {
  loadMessengerLegacyAccess,
  type MessengerLegacyAccessContext,
} from '../access/messenger-legacy-channel-access.op';
import type { MessengerCoreAccessFacts } from './messenger-core-access.types';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type MessengerCoreAccessLoad = {
  access: MessengerLegacyAccessContext | null;
  facts: MessengerCoreAccessFacts | null;
};

export async function loadMessengerCoreAccessFacts(
  prisma: PrismaLike,
  employeeId: string,
  conversationId: string,
): Promise<MessengerCoreAccessLoad> {
  const access = await loadMessengerLegacyAccess(prisma, employeeId);
  if (!access) return { access: null, facts: null };
  const conversation = await prisma.messengerConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, zone: true, type: true },
  });
  if (!conversation) return { access, facts: null };

  const [participant, grant] = await Promise.all([
    prisma.messengerConversationParticipant.findFirst({
      where: { conversationId, employeeId, leftAt: null },
      select: { role: true },
    }),
    prisma.resourceAccessGrant.findFirst({
      where: {
        resourceType: RESOURCE_GRANT_RESOURCE_TYPE.MESSENGER_CONVERSATION,
        resourceId: conversationId,
        employeeId,
        ...activeResourceAccessGrantWhere(),
      },
      select: { level: true },
    }),
  ]);

  return {
    access,
    facts: {
      conversationId: conversation.id,
      zone: conversation.zone,
      conversationType: conversation.type,
      viewScope: access.viewScope,
      editScope: access.editScope,
      clientReadScope: access.clientReadScope,
      clientSendScope: access.clientSendScope,
      isActiveParticipant: Boolean(participant),
      participantRole: participant?.role ?? null,
      grantLevel: grant?.level === 'EDIT' || grant?.level === 'VIEW' ? grant.level : null,
    },
  };
}
