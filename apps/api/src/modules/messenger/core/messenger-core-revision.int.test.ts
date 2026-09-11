import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@nbos/database';
import { persistCoreMessage } from './messenger-core-message.ops';
import { createCoreConversation } from './messenger-core-conversation.ops';
import { snapshotMessengerZoneRead } from './messenger-core-revision-snapshot.ops';
import { allocateZoneRevision, shareLockZoneRevision } from './messenger-core-revision-write.ops';
import { runMessengerReadTx, runMessengerWriteTx } from './messenger-core-revision-tx';

const DATABASE_URL = process.env.AI_PLATFORM_DB_TEST_URL ?? process.env.MESSENGER_CORE_DB_TEST_URL;
const CASE_TIMEOUT_MS = 60_000;

describe.skipIf(!DATABASE_URL)('Messenger revision commit/checkpoint ordering', () => {
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
      await prisma.messengerConversation.deleteMany({ where: { id: { in: conversationIds } } });
    }
    await prisma.$disconnect();
  });

  it(
    'gives a reader that locks first the old checkpoint while the later writer commits a higher revision',
    async () => {
      const conversation = await createConversation();
      const before = await snapshotMessengerZoneRead(prisma, 'INTERNAL', async () => 'snap');
      let release!: () => void;
      const locked = new Promise<void>((resolve) => {
        release = resolve;
      });
      const reader = runMessengerReadTx(prisma, async (tx) => {
        const revision = await shareLockZoneRevision(tx, 'INTERNAL');
        release();
        await delay(200);
        return revision;
      });
      await locked;
      const persist = persistCoreMessage(
        prisma,
        { conversationId: conversation.id, senderId: employeeId, content: 'hello' },
        [],
      );
      const readerRevision = await reader;
      await persist;
      expect(readerRevision).toBe(BigInt(before.checkpoint));
      const after = await snapshotMessengerZoneRead(prisma, 'INTERNAL', async () => 'snap');
      expect(BigInt(after.checkpoint)).toBeGreaterThan(readerRevision);
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'lets a reader that starts after the writer counter wait and see committed state plus the new checkpoint',
    async () => {
      const conversation = await createConversation();
      let release!: () => void;
      const allocated = new Promise<void>((resolve) => {
        release = resolve;
      });
      const writer = runMessengerWriteTx(prisma, async (tx) => {
        await tx.messengerConversation.update({
          where: { id: conversation.id },
          data: { title: 'after-writer' },
        });
        const revision = await allocateZoneRevision(tx, 'INTERNAL');
        await tx.messengerConversationRevision.upsert({
          where: { zone_conversationId: { zone: 'INTERNAL', conversationId: conversation.id } },
          create: {
            zone: 'INTERNAL',
            conversationId: conversation.id,
            changeKind: 'CONVERSATION',
            revision,
          },
          update: { changeKind: 'CONVERSATION', revision },
        });
        release();
        await delay(150);
        return revision;
      });
      await allocated;
      const snap = snapshotMessengerZoneRead(prisma, 'INTERNAL', async (client) => {
        const row = await client.messengerConversation.findUnique({
          where: { id: conversation.id },
          select: { title: true },
        });
        return row?.title ?? '';
      });
      const [writerRevision, reader] = await Promise.all([writer, snap]);
      expect(reader.checkpoint).toBe(writerRevision.toString(10));
      expect(reader.value).toBe('after-writer');
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'lets concurrent same-zone writers both commit with ordered revisions',
    async () => {
      const first = await createConversation();
      const second = await createConversation();
      await Promise.all([
        persistCoreMessage(
          prisma,
          { conversationId: first.id, senderId: employeeId, content: 'a' },
          [],
        ),
        persistCoreMessage(
          prisma,
          { conversationId: second.id, senderId: employeeId, content: 'b' },
          [],
        ),
      ]);
      const rows = await prisma.messengerConversationRevision.findMany({
        where: { conversationId: { in: [first.id, second.id] } },
        select: { revision: true },
      });
      const revisions = rows
        .map((row) => row.revision)
        .sort((left, right) => (left < right ? -1 : 1));
      expect(revisions).toHaveLength(2);
      expect(revisions[1]).toBeGreaterThan(revisions[0] ?? 0n);
    },
    CASE_TIMEOUT_MS,
  );

  async function createConversation() {
    const conversation = await createCoreConversation(prisma, {
      zone: 'INTERNAL',
      type: 'INTERNAL_GROUP',
      createdById: employeeId,
      title: `rev-${randomUUID()}`,
    });
    conversationIds.push(conversation.id);
    return conversation;
  }
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
