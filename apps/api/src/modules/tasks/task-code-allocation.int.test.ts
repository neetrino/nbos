import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@nbos/database';
import { TaskCreationService } from './task-creation.service';
import { TasksService } from './tasks.service';
import { AutoTasksService } from '../automation/auto-tasks.service';

/**
 * Concurrent Task creation driven through two independent producers of the
 * `T-{year}` code series: human `TasksService` and `AutoTasksService`.
 * Both now insert through `TaskCreationService`.
 *
 * The allocator's own contention is covered by `entity-code-counter.int.test.ts`.
 * What this adds is the property that actually broke: these are separate services
 * that historically derived a code from `max(tasks)`, so a fix applied to one of
 * them left the other able to strand the counter and collide. Reproducing that
 * needs the public service paths running together, not the allocator alone.
 *
 * The third writer, `SupportService.createExecutionTask`, is not exercised here —
 * it needs a ticket, product and workspace fixture chain. Its unit test asserts
 * the same property (code taken from the counter, tasks table never read), so the
 * gap is coverage depth rather than an unverified writer.
 *
 * Opt-in: set `AI_PLATFORM_DB_TEST_URL` to a disposable database. Every task is
 * tagged with a generated link id and removed afterwards.
 */
const DATABASE_URL = process.env.AI_PLATFORM_DB_TEST_URL;
const DIRECT_CREATES = 12;
const AUTOMATION_BATCHES = 3;
const LOGO_BLUEPRINT_SIZE = 5;
const CASE_TIMEOUT_MS = 120_000;

describe.skipIf(!DATABASE_URL)('Task code allocation across writers (real database)', () => {
  let prisma: InstanceType<typeof PrismaClient>;
  let tasks: TasksService;
  let automation: AutoTasksService;
  let creatorId: string;
  const runId = `code-probe-${randomUUID()}`;

  beforeAll(async () => {
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: DATABASE_URL }),
    }) as InstanceType<typeof PrismaClient>;

    // `Task.creatorId` is a foreign key, so the probe borrows an existing employee
    // rather than inventing one and dragging in the Person/Employee fixture chain.
    const employee = await prisma.employee.findFirst({ select: { id: true } });
    if (!employee) throw new Error('No employee exists in the test database');
    creatorId = employee.id;

    const notifications = { create: () => Promise.resolve({ id: 'unused' }) };
    const taskCreation = new TaskCreationService(prisma as never);
    tasks = new TasksService(prisma as never, notifications as never, taskCreation);
    automation = new AutoTasksService(taskCreation);
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
    'gives Tasks and Automation distinct codes when they create concurrently',
    async () => {
      const directCreates = Array.from({ length: DIRECT_CREATES }, (_, i) =>
        tasks.create({
          title: `${runId} direct ${i}`,
          creatorId,
          links: [{ entityType: 'DEAL', entityId: runId }],
        }),
      );
      const automationBatches = Array.from({ length: AUTOMATION_BATCHES }, () =>
        automation.generateTasksForDeal(runId, 'LOGO', creatorId),
      );

      // A rejection here is the defect itself: a duplicate code surfaces as P2002.
      await Promise.all([...directCreates, ...automationBatches]);

      const created = await prisma.task.findMany({
        where: { links: { some: { entityId: runId } } },
        select: { code: true },
      });
      const expectedCount = DIRECT_CREATES + AUTOMATION_BATCHES * LOGO_BLUEPRINT_SIZE;

      expect(created).toHaveLength(expectedCount);
      expect(new Set(created.map((t) => t.code)).size).toBe(expectedCount);
    },
    CASE_TIMEOUT_MS,
  );
});
