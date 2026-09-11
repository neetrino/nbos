import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@nbos/database';
import { createCoreConversation } from './messenger-core-conversation.ops';
import { persistCoreMessage } from './messenger-core-message.ops';
import { createCoreExternalMapping } from './messenger-core-mapping.ops';
import { whatsAppOutboundIdempotencyKey } from './messenger-wa-identity';

/**
 * Gated real-Postgres concurrent HTTP persist. Does not run without a disposable URL.
 * Set `AI_PLATFORM_DB_TEST_URL` or `MESSENGER_CORE_DB_TEST_URL`.
 */
const DATABASE_URL = process.env.AI_PLATFORM_DB_TEST_URL ?? process.env.MESSENGER_CORE_DB_TEST_URL;
const CASE_TIMEOUT_MS = 60_000;
const CHAT = '37499111222@c.us';

describe.skipIf(!DATABASE_URL)('HTTP idempotency concurrent persist (real database)', () => {
  let prisma: InstanceType<typeof PrismaClient>;
  let employeeId: string;
  const conversationIds: string[] = [];

  beforeAll(async () => {
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: DATABASE_URL }),
    }) as InstanceType<typeof PrismaClient>;
    const employee = await prisma.employee.findFirst({ select: { id: true } });
    if (!employee) throw new Error('Need an employee in the test database');
    employeeId = employee.id;
  });

  afterAll(async () => {
    if (conversationIds.length > 0) {
      await prisma.messengerCommand.deleteMany({
        where: { conversationId: { in: conversationIds } },
      });
      await prisma.messengerConversation.deleteMany({ where: { id: { in: conversationIds } } });
    }
    await prisma.$disconnect();
  });

  it(
    'serializes duplicate HTTP persists to one Message and one Command',
    async () => {
      const conversation = await createCoreConversation(prisma, {
        zone: 'CLIENT',
        type: 'EXTERNAL',
        createdById: employeeId,
        title: `p4b-http-${randomUUID()}`,
      });
      conversationIds.push(conversation.id);
      await createCoreExternalMapping(prisma, {
        conversationId: conversation.id,
        provider: 'WHATSAPP',
        providerAccountId: 'acc_a',
        providerConversationId: CHAT,
      });
      const httpKey = `http-${randomUUID()}`;
      const intent = {
        mapping: { externalAccountId: 'acc_a', externalConversationId: CHAT },
        actorEmployeeId: employeeId,
      };
      const input = {
        conversationId: conversation.id,
        senderId: employeeId,
        content: 'dup',
        status: 'QUEUED' as const,
        direction: 'OUTBOUND' as const,
        idempotencyKey: httpKey,
      };
      const [first, second] = await Promise.all([
        persistCoreMessage(prisma, input, [], intent),
        persistCoreMessage(prisma, input, [], intent),
      ]);
      expect(first.id).toBe(second.id);
      const messages = await prisma.messengerMessage.findMany({
        where: { conversationId: conversation.id, idempotencyKey: httpKey },
      });
      const commands = await prisma.messengerCommand.findMany({
        where: { idempotencyKey: whatsAppOutboundIdempotencyKey(first.id) },
      });
      expect(messages).toHaveLength(1);
      expect(commands).toHaveLength(1);
    },
    CASE_TIMEOUT_MS,
  );
});
