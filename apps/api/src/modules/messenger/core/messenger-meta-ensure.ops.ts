import { ConflictException } from '@nestjs/common';
import {
  PrismaClient,
  classifyDatabaseError,
  type MessengerExternalProvider,
} from '@nbos/database';
import { MESSENGER_CORE_CLIENT_ZONE } from './messenger-core.constants';
import { legacyMetaCanonicalKey } from './messenger-core-canonical-key';
import { upsertCoreExternalMapping } from './messenger-core-mapping.ops';
import { metaConversationLegacyIdentity } from './messenger-legacy-identity';
import { bumpGlobalConversationRevision } from './messenger-core-revision-write.ops';
import { runMessengerWriteTx } from './messenger-core-revision-tx';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type MetaClientEnsureInput = {
  metaConversationId: string;
  provider: MessengerExternalProvider;
  providerAccountId: string;
  title: string | null;
  leadId: string | null;
};

export type MetaClientEnsureResult = {
  id: string;
  created: boolean;
};

export async function ensureMetaClientConversation(
  prisma: PrismaLike,
  input: MetaClientEnsureInput,
): Promise<MetaClientEnsureResult> {
  const proven = await findProvenMetaConversation(prisma, input.metaConversationId);
  if (proven) {
    await attachMetaIdentity(prisma, proven.id, input);
    return { id: proven.id, created: false };
  }
  const created = await createOrReuseByCanonicalKey(prisma, input);
  await attachMetaIdentity(prisma, created.id, input);
  return created;
}

async function findProvenMetaConversation(
  prisma: PrismaLike,
  metaConversationId: string,
): Promise<{ id: string } | null> {
  const identity = await prisma.messengerLegacyIdentity.findUnique({
    where: { sourceKind_sourceId: metaConversationLegacyIdentity(metaConversationId) },
    select: { conversationId: true },
  });
  if (!identity?.conversationId) return null;
  return { id: identity.conversationId };
}

async function createOrReuseByCanonicalKey(
  prisma: PrismaLike,
  input: MetaClientEnsureInput,
): Promise<MetaClientEnsureResult> {
  const canonicalKey = legacyMetaCanonicalKey(input.metaConversationId);
  const existing = await prisma.messengerConversation.findUnique({
    where: { canonicalKey },
    select: { id: true },
  });
  if (existing) return { id: existing.id, created: false };
  try {
    const created = await runMessengerWriteTx(prisma, async (tx) => {
      const row = await tx.messengerConversation.create({
        data: {
          zone: MESSENGER_CORE_CLIENT_ZONE,
          kind: 'EXTERNAL',
          type: 'EXTERNAL',
          title: input.title,
          canonicalKey,
          metadata: { metaConversationId: input.metaConversationId },
        },
        select: { id: true, zone: true },
      });
      await bumpGlobalConversationRevision(tx, row.zone, row.id);
      return row;
    });
    return { id: created.id, created: true };
  } catch (error) {
    if (classifyDatabaseError(error)?.code !== 'DB_UNIQUE_CONSTRAINT') throw error;
    const raced = await prisma.messengerConversation.findUnique({
      where: { canonicalKey },
      select: { id: true },
    });
    if (!raced) throw new ConflictException('Meta Client conversation conflict');
    return { id: raced.id, created: false };
  }
}

async function attachMetaIdentity(
  prisma: PrismaLike,
  conversationId: string,
  input: MetaClientEnsureInput,
): Promise<void> {
  await prisma.messengerLegacyIdentity.createMany({
    data: [{ ...metaConversationLegacyIdentity(input.metaConversationId), conversationId }],
    skipDuplicates: true,
  });
  await upsertCoreExternalMapping(prisma, {
    conversationId,
    provider: input.provider,
    providerAccountId: input.providerAccountId,
    providerConversationId: input.metaConversationId,
  });
  if (!input.leadId) return;
  await prisma.messengerConversationLink.createMany({
    data: [
      {
        conversationId,
        entityType: 'LEAD',
        entityId: input.leadId,
        relationType: 'PRIMARY',
      },
    ],
    skipDuplicates: true,
  });
}
