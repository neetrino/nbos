import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@nbos/database';
import { AuditService } from '../../audit/audit.service';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { ExternalAgentService } from '../agents/external-agent.service';
import { AgentCredentialService } from './agent-credential.service';

/**
 * Lock-order regression test against a real PostgreSQL database.
 *
 * Credential rotation and agent revoke both touch the agent row and credential
 * rows. If they take those locks in opposite orders, PostgreSQL resolves the
 * cycle by aborting one transaction with SQLSTATE 40P01 instead of letting the
 * loser fail with a domain error. A mocked Prisma client cannot model a lock
 * graph, so this can only be proven here.
 *
 * Opt-in: set `AI_PLATFORM_DB_TEST_URL` to a disposable database. The test
 * creates its own agent, credentials and audit rows and deletes all of them.
 */
const DATABASE_URL = process.env.AI_PLATFORM_DB_TEST_URL;
const ATTEMPTS = 25;
const DEADLOCK_SQLSTATE = '40P01';

function isDeadlock(error: unknown): boolean {
  const text = error instanceof Error ? `${error.message}` : String(error);
  return text.includes(DEADLOCK_SQLSTATE) || text.toLowerCase().includes('deadlock');
}

describe.skipIf(!DATABASE_URL)('credential rotation versus agent revoke (real database)', () => {
  let prisma: InstanceType<typeof PrismaClient>;
  let agents: ExternalAgentService;
  let credentials: AgentCredentialService;
  let employeeId: string;
  const createdAgentIds: string[] = [];

  beforeAll(async () => {
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: DATABASE_URL }),
    }) as InstanceType<typeof PrismaClient>;
    const audit = new AiPlatformAuditService(new AuditService(prisma));
    agents = new ExternalAgentService(prisma, audit);
    credentials = new AgentCredentialService(prisma, audit);

    const employee = await prisma.employee.findFirst({ select: { id: true } });
    if (!employee) {
      throw new Error('The target database has no employee to own a test agent');
    }
    employeeId = employee.id;
  });

  afterAll(async () => {
    if (createdAgentIds.length > 0) {
      const credentialIds = await prisma.externalAgentCredential.findMany({
        where: { agentId: { in: createdAgentIds } },
        select: { id: true },
      });
      await prisma.auditLog.deleteMany({
        where: { entityId: { in: [...createdAgentIds, ...credentialIds.map((row) => row.id)] } },
      });
      await prisma.externalAgent.deleteMany({ where: { id: { in: createdAgentIds } } });
    }
    await prisma.$disconnect();
  });

  it('never deadlocks when both run concurrently', async () => {
    const deadlocks: unknown[] = [];

    for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
      const agent = await agents.create(
        { name: `lock-order-probe-${attempt}`, ownerId: employeeId },
        employeeId,
      );
      createdAgentIds.push(agent.id);
      const issued = await credentials.issue({ agentId: agent.id }, employeeId);

      const outcomes = await Promise.allSettled([
        credentials.rotate({ credentialId: issued.credential.id }, employeeId),
        agents.revoke(agent.id, employeeId),
      ]);

      for (const outcome of outcomes) {
        if (outcome.status === 'rejected' && isDeadlock(outcome.reason)) {
          deadlocks.push(outcome.reason);
        }
      }
    }

    expect(deadlocks).toEqual([]);
  }, 120_000);

  it('leaves a revoked agent with no usable credential', async () => {
    const agent = await agents.create(
      { name: 'lock-order-final-state', ownerId: employeeId },
      employeeId,
    );
    createdAgentIds.push(agent.id);
    const issued = await credentials.issue({ agentId: agent.id }, employeeId);

    await Promise.allSettled([
      credentials.rotate({ credentialId: issued.credential.id }, employeeId),
      agents.revoke(agent.id, employeeId),
    ]);

    const [state, live] = await Promise.all([
      prisma.externalAgent.findUniqueOrThrow({ where: { id: agent.id } }),
      prisma.externalAgentCredential.count({ where: { agentId: agent.id, revokedAt: null } }),
    ]);

    // Either the revoke won and every credential is revoked with it, or the
    // rotation won and the revoke that followed still caught the successor.
    expect(state.revokedAt).not.toBeNull();
    expect(live).toBe(0);
  }, 60_000);
});
