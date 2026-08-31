import { PrismaClient } from '@nbos/database';
import type { MessengerCoreMessageDto } from './messenger-core.types';
import { persistMetaInboundCoreMessageTx } from './messenger-meta-inbound.ops';
import { ensureMetaClientConversation } from './messenger-meta-ensure.ops';
import { metaProviderFromPlatform, metaProviderMessageKey } from './messenger-meta-identity';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type LiveMetaInboundInput = {
  metaConversationId: string;
  leadId: string | null;
  providerAccountId: string;
  platform: string;
  providerMessageId: string;
  text: string | null;
  senderName: string;
  sentAt: Date;
};

export async function persistLiveMetaInboundToCore(
  prisma: PrismaLike,
  input: LiveMetaInboundInput,
): Promise<{ conversationId: string; message: MessengerCoreMessageDto; created: boolean }> {
  const ensured = await ensureMetaClientConversation(prisma, {
    metaConversationId: input.metaConversationId,
    provider: metaProviderFromPlatform(input.platform),
    providerAccountId: input.providerAccountId,
    title: input.senderName,
    leadId: input.leadId,
  });
  const persisted = await persistMetaInboundCoreMessageTx(prisma, {
    conversationId: ensured.id,
    providerMessageKey: metaProviderMessageKey(
      input.platform,
      input.providerAccountId,
      input.providerMessageId,
    ),
    content: input.text?.trim() ? input.text : '',
    senderName: input.senderName,
    direction: 'INBOUND',
    createdAt: input.sentAt,
  });
  return { conversationId: ensured.id, message: persisted.message, created: persisted.created };
}
