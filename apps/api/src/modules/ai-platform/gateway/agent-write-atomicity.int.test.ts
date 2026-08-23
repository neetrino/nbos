import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@nbos/database';
import { TaskCreationService } from '../../tasks/task-creation.service';
import { TasksService } from '../../tasks/tasks.service';

/**
 * The External Agent gateway commits a Tasks write and its idempotency
 * checkpoint in one transaction. That only holds if the domain service actually
 * writes through the client it is handed — a single leftover `this.prisma` would
 * let the task escape the transaction and survive a rollback, which is the exact
 * failure the shared transaction is meant to remove (checklist item 209).
 *
 * Mocks cannot show this: they would record the client that was passed without
 * proving the write joined that transaction. So the check is a real rollback.
 *
 * Opt-in: set `AI_PLATFORM_DB_TEST_URL` to a disposable database.
 */
const DATABASE_URL = process.env.AI_PLATFORM_DB_TEST_URL;
const CASE_TIMEOUT_MS = 30_000;

describe.skipIf(!DATABASE_URL)('Agent Tasks write atomicity (real database)', () => {
  let prisma: InstanceType<typeof PrismaClient>;
  let tasks: TasksService;
  let creatorId: string;
  const runId = `atomicity-probe-${randomUUID()}`;

  beforeAll(async () => {
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: DATABASE_URL }),
    }) as InstanceType<typeof PrismaClient>;

    // `Task.creatorId` is a foreign key, so the probe borrows an existing
    // employee rather than dragging in the Person/Employee fixture chain.
    const employee = await prisma.employee.findFirst({ select: { id: true } });
    if (!employee) throw new Error('No employee exists in the test database');
    creatorId = employee.id;

    const notifications = { create: () => Promise.resolve({ id: 'unused' }) };
    tasks = new TasksService(
      prisma as never,
      notifications as never,
      new TaskCreationService(prisma as never),
    );
  });

  afterAll(async () => {
    const links = await prisma.taskLink.findMany({
      where: { entityId: runId },
      select: { taskId: true },
    });
    await prisma.taskLink.deleteMany({ where: { entityId: runId } });
    await prisma.task.deleteMany({ where: { id: { in: links.map((l) => l.taskId) } } });
    await prisma.$disconnect();
  });

  it(
    'leaves no task behind when the surrounding transaction fails after the write',
    async () => {
      await expect(
        prisma.$transaction(async (tx) => {
          await tasks.create(
            {
              title: `${runId} rolled back`,
              creatorId,
              links: [{ entityType: 'DEAL', entityId: runId }],
            },
            undefined,
            tx,
          );
          // Stands in for a checkpoint failure, or for a crash between the two
          // writes the gateway now performs together.
          throw new Error('checkpoint failed');
        }),
      ).rejects.toThrow('checkpoint failed');

      const survived = await prisma.task.findMany({
        where: { links: { some: { entityId: runId } } },
        select: { id: true },
      });
      expect(survived).toHaveLength(0);
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'persists the task when the surrounding transaction commits',
    async () => {
      const created = await prisma.$transaction(async (tx) =>
        tasks.create(
          {
            title: `${runId} committed`,
            creatorId,
            links: [{ entityType: 'DEAL', entityId: runId }],
          },
          undefined,
          tx,
        ),
      );

      const found = await prisma.task.findUnique({ where: { id: created.id } });
      expect(found?.code).toBe(created.code);
    },
    CASE_TIMEOUT_MS,
  );
});
