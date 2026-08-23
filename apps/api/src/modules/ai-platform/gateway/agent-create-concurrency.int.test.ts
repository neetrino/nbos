import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@nbos/database';
import { actorContextFromMachine } from '@nbos/shared';
import { TaskCreationService } from '../../tasks/task-creation.service';
import { TasksService } from '../../tasks/tasks.service';
import { AgentCapabilityGateway } from './agent-capability.gateway';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import type { TasksDbClient } from '../../tasks/tasks-db-client';
import { toAgentTaskProjection } from './agent-task-projection';
import { allocateTaskCode } from '../../tasks/task-code-generation';

/**
 * C26: six concurrent `tasks.create` through the gateway's shared
 * task+checkpoint transaction. The live REST burst failed here with
 * `Transaction API error … timeout … 5000 ms` inside `allocateEntityCodeNumber`
 * — not P2002 — because the counter upsert ran on the interactive transaction
 * and held `(TASK, year)` until checkpoint committed.
 *
 * `TasksService.create` alone cannot reproduce that: it only shows allocation
 * on a caller-supplied client. This case opens the real gateway transaction
 * and hands that client to `create`, which is the path that timed out.
 *
 * Opt-in: set `AI_PLATFORM_DB_TEST_URL` to a disposable database.
 */
const DATABASE_URL = process.env.AI_PLATFORM_DB_TEST_URL;
const CONCURRENT_CREATES = 6;
const CASE_TIMEOUT_MS = 30_000;

function unused(): never {
  throw new Error('unused handler');
}

function agent(): AuthenticatedAgent {
  return {
    agentId: 'agent-1',
    agentName: 'Cursor Agent',
    agentState: 'ACTIVE',
    credentialId: 'cred-1',
    credentialKeyId: 'aabbccddeeff001122',
    credentialState: 'ACTIVE',
    actor: actorContextFromMachine({
      id: 'agent-1',
      type: 'EXTERNAL_AGENT',
      displayName: 'Cursor Agent',
    }),
  };
}

function gatewayForConcurrentCreate(
  prisma: InstanceType<typeof PrismaClient>,
  tasks: TasksService,
  creatorId: string,
  runId: string,
): AgentCapabilityGateway {
  return new AgentCapabilityGateway(
    prisma as never,
    { read: unused } as never,
    { list: unused, read: unused, readLinks: unused, readDiscussion: unused } as never,
    {
      prepareCreate: async (_agent: AuthenticatedAgent, input: Record<string, unknown>) => ({
        title: String(input.title),
        workspaceId: 'ws-unused',
        creatorId,
        actor: { type: 'EXTERNAL_AGENT', id: 'agent-1' },
      }),
      commitPreparedCreate: async (
        prepared: { title: string; creatorId: string; actor: { type: string; id: string } },
        reservedCode: string | undefined,
        tx?: TasksDbClient,
      ) => {
        const created = await tasks.create(
          {
            title: prepared.title,
            creatorId: prepared.creatorId,
            links: [{ entityType: 'DEAL', entityId: runId }],
          },
          prepared.actor,
          tx,
          reservedCode,
        );
        return toAgentTaskProjection(created);
      },
      reserveCreateCode: () => allocateTaskCode(prisma),
      update: unused,
      start: unused,
      comment: unused,
      submitReview: unused,
    } as never,
    { readTaskArtifact: unused, attachArtifact: unused } as never,
    {
      reserve: () => Promise.resolve(null),
      complete: () => Promise.resolve(),
      abort: () => Promise.resolve(),
      checkpointCommittedResult: () => Promise.resolve(),
    } as never,
    { assertStillAuthorized: () => Promise.resolve() } as never,
    { logMachineAction: () => Promise.resolve() } as never,
  );
}

describe.skipIf(!DATABASE_URL)(
  'Agent create concurrency through the gateway (real database)',
  () => {
    let prisma: InstanceType<typeof PrismaClient>;
    let gateway: AgentCapabilityGateway;
    let creatorId: string;
    const runId = `c26-probe-${randomUUID()}`;

    beforeAll(async () => {
      prisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString: DATABASE_URL }),
      }) as InstanceType<typeof PrismaClient>;

      const employee = await prisma.employee.findFirst({ select: { id: true } });
      if (!employee) throw new Error('No employee exists in the test database');
      creatorId = employee.id;

      const tasks = new TasksService(
        prisma as never,
        {
          create: () => Promise.resolve({ id: 'unused' }),
        } as never,
        new TaskCreationService(prisma as never),
      );
      gateway = gatewayForConcurrentCreate(prisma, tasks, creatorId, runId);
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
      'returns six distinct codes when six gateway creates run concurrently',
      async () => {
        const results = await Promise.all(
          Array.from({ length: CONCURRENT_CREATES }, (_, i) =>
            gateway.invoke({
              agent: agent(),
              capabilityKey: 'tasks.create',
              input: { workspaceId: 'ws-unused', title: `${runId} ${i}` },
              idempotencyKey: `${runId}-${i}`,
            }),
          ),
        );

        const codes = results.map((result) => {
          const data = result.data as { code?: unknown };
          if (typeof data.code !== 'string') {
            throw new Error('gateway create returned no code');
          }
          return data.code;
        });

        expect(codes).toHaveLength(CONCURRENT_CREATES);
        expect(new Set(codes).size).toBe(CONCURRENT_CREATES);

        const persisted = await prisma.task.findMany({
          where: { links: { some: { entityId: runId } } },
          select: { code: true },
        });
        expect(persisted).toHaveLength(CONCURRENT_CREATES);
        expect(new Set(persisted.map((row) => row.code)).size).toBe(CONCURRENT_CREATES);
      },
      CASE_TIMEOUT_MS,
    );
  },
);
