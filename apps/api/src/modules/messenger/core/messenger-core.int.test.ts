import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@nbos/database';
import { createCoreConversation } from './messenger-core-conversation.ops';
import { persistCoreMessage } from './messenger-core-message.ops';
import { addCoreConversationLink } from './messenger-core-link.ops';
import {
  createCoreMessageReference,
  deleteCoreMessageReference,
} from './messenger-core-reference.ops';
import { createCoreExternalMapping } from './messenger-core-mapping.ops';
import { mapLegacyChannelToCore } from './messenger-legacy-mapper.ops';
import { markCoreConversationRead, addCoreParticipant } from './messenger-core-participant.ops';
import { ForbiddenException } from '@nestjs/common';

/**
 * Opt-in real Postgres proof for Slice 1 constraints.
 * Set `AI_PLATFORM_DB_TEST_URL` or `MESSENGER_CORE_DB_TEST_URL` to a disposable database
 * that already has Slice 1 migrations applied.
 */
const DATABASE_URL = process.env.AI_PLATFORM_DB_TEST_URL ?? process.env.MESSENGER_CORE_DB_TEST_URL;
const CASE_TIMEOUT_MS = 60_000;

describe.skipIf(!DATABASE_URL)('Messaging Core relational foundation (real database)', () => {
  let prisma: InstanceType<typeof PrismaClient>;
  let employeeA: string;
  let employeeB: string;
  const conversationIds: string[] = [];
  const channelIds: string[] = [];

  beforeAll(async () => {
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: DATABASE_URL }),
    }) as InstanceType<typeof PrismaClient>;
    const employees = await prisma.employee.findMany({ take: 2, select: { id: true } });
    if (employees.length < 2) {
      throw new Error('Need two employees in the test database');
    }
    employeeA = employees[0]!.id;
    employeeB = employees[1]!.id;
  });

  afterAll(async () => {
    if (conversationIds.length > 0) {
      await prisma.messengerMessageReference.deleteMany({
        where: { sourceConversationId: { in: conversationIds } },
      });
      await prisma.messengerLegacyIdentity.deleteMany({
        where: { conversationId: { in: conversationIds } },
      });
      await prisma.messengerCommand.deleteMany({
        where: { conversationId: { in: conversationIds } },
      });
      await prisma.messengerConversation.deleteMany({ where: { id: { in: conversationIds } } });
    }
    if (channelIds.length > 0) {
      await prisma.messengerChannel.deleteMany({ where: { id: { in: channelIds } } });
    }
    await prisma.$disconnect();
  });

  it(
    'persists INTERNAL conversation/message/participant/read-state and keeps zone immutable',
    async () => {
      const conversation = await createCoreConversation(prisma, {
        zone: 'INTERNAL',
        type: 'INTERNAL_GROUP',
        createdById: employeeA,
        title: `slice1-${randomUUID()}`,
      });
      conversationIds.push(conversation.id);
      expect(conversation.zone).toBe('INTERNAL');
      await addCoreParticipant(prisma, conversation.id, employeeB, 'MEMBER');
      const message = await persistCoreMessage(
        prisma,
        { conversationId: conversation.id, senderId: employeeA, content: 'core hello' },
        [],
      );
      expect(message.direction).toBe('INTERNAL');
      await markCoreConversationRead(prisma, conversation.id, employeeA, new Date());
      await expect(
        prisma.messengerConversation.update({
          where: { id: conversation.id },
          data: { zone: 'CLIENT' },
        }),
      ).rejects.toThrow(/immutable/i);
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'allows Product + Work Space links on one conversation and unique DIRECT keys',
    async () => {
      const conversation = await createCoreConversation(prisma, {
        zone: 'INTERNAL',
        type: 'INTERNAL_GROUP',
        createdById: employeeA,
        title: `slice1-links-${randomUUID()}`,
      });
      conversationIds.push(conversation.id);
      await addCoreConversationLink(prisma, conversation.id, {
        entityType: 'PRODUCT',
        entityId: randomUUID(),
        relationType: 'PRIMARY',
      });
      await addCoreConversationLink(prisma, conversation.id, {
        entityType: 'WORKSPACE',
        entityId: randomUUID(),
        relationType: 'RELATED',
      });
      const first = await createCoreConversation(prisma, {
        zone: 'INTERNAL',
        type: 'DIRECT',
        createdById: employeeA,
        peerEmployeeId: employeeB,
      });
      conversationIds.push(first.id);
      const second = await createCoreConversation(prisma, {
        zone: 'INTERNAL',
        type: 'DIRECT',
        createdById: employeeB,
        peerEmployeeId: employeeA,
      });
      expect(second.id).toBe(first.id);
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'keeps MessageReference source after deleting the reference and rejects missing source',
    async () => {
      const conversation = await createCoreConversation(prisma, {
        zone: 'INTERNAL',
        type: 'INTERNAL_GROUP',
        createdById: employeeA,
        title: `slice1-ref-${randomUUID()}`,
      });
      conversationIds.push(conversation.id);
      const source = await persistCoreMessage(
        prisma,
        { conversationId: conversation.id, senderId: employeeA, content: 'source' },
        [],
      );
      const reference = await createCoreMessageReference(prisma, {
        sourceMessageId: source.id,
        targetEntityType: 'TASK',
        targetEntityId: randomUUID(),
        purpose: 'TASK_SOURCE',
      });
      await deleteCoreMessageReference(prisma, reference.id);
      const stillThere = await prisma.messengerMessage.findUnique({ where: { id: source.id } });
      expect(stillThere?.id).toBe(source.id);
      await expect(
        createCoreMessageReference(prisma, {
          sourceMessageId: randomUUID(),
          targetEntityType: 'TASK',
          targetEntityId: randomUUID(),
          purpose: 'TASK_SOURCE',
        }),
      ).rejects.toThrow();
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'rejects INTERNAL provider mapping and attachment to a missing FileAsset',
    async () => {
      const conversation = await createCoreConversation(prisma, {
        zone: 'INTERNAL',
        type: 'INTERNAL_GROUP',
        createdById: employeeA,
        title: `slice1-map-${randomUUID()}`,
      });
      conversationIds.push(conversation.id);
      await expect(
        createCoreExternalMapping(prisma, {
          conversationId: conversation.id,
          provider: 'WHATSAPP',
          providerAccountId: 'acc',
          providerConversationId: 'chat',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        persistCoreMessage(
          prisma,
          {
            conversationId: conversation.id,
            senderId: employeeA,
            content: 'with file',
            fileAssetIds: [randomUUID()],
          },
          [randomUUID()],
        ),
      ).rejects.toThrow();
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'maps Channel → Core idempotently and does not drop Channel tables',
    async () => {
      const channel = await prisma.messengerChannel.create({
        data: {
          name: `slice1-ch-${randomUUID()}`,
          projectId: 'system',
          type: 'GENERAL',
        },
      });
      channelIds.push(channel.id);
      const first = await mapLegacyChannelToCore(prisma, channel.id);
      expect(first?.created).toBe(true);
      if (first) conversationIds.push(first.conversationId);
      const second = await mapLegacyChannelToCore(prisma, channel.id);
      expect(second?.conversationId).toBe(first?.conversationId);
      expect(second?.created).toBe(false);
      const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename IN ('messenger_channels', 'messenger_direct_threads')
      `;
      expect(tables.map((row) => row.tablename).sort()).toEqual([
        'messenger_channels',
        'messenger_direct_threads',
      ]);
    },
    CASE_TIMEOUT_MS,
  );
});
