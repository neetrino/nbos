import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@nbos/database';
import { AuditService } from '../../audit/audit.service';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { ExternalAgentService } from '../agents/external-agent.service';
import { AgentAuthenticatorService } from '../auth/agent-authenticator.service';
import { AgentCredentialService } from '../credentials/agent-credential.service';
import { AgentGrantService } from '../grants/agent-grant.service';

/**
 * Real-database smoke for Chat 3: issue → authenticate → grant → scope,
 * plus grant/scope versus agent revoke lock order.
 *
 * Opt-in: set `AI_PLATFORM_DB_TEST_URL` to a disposable database.
 */
const DATABASE_URL = process.env.AI_PLATFORM_DB_TEST_URL;
const ATTEMPTS = 25;
const DEADLOCK_SQLSTATE = '40P01';

function isDeadlock(error: unknown): boolean {
  const text = error instanceof Error ? `${error.message}` : String(error);
  return text.includes(DEADLOCK_SQLSTATE) || text.toLowerCase().includes('deadlock');
}

describe.skipIf(!DATABASE_URL)('AI platform persistence smoke (real database)', () => {
  let prisma: InstanceType<typeof PrismaClient>;
  let agents: ExternalAgentService;
  let credentials: AgentCredentialService;
  let grants: AgentGrantService;
  let authenticator: AgentAuthenticatorService;
  let employeeId: string;
  const createdAgentIds: string[] = [];

  beforeAll(async () => {
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: DATABASE_URL }),
    }) as InstanceType<typeof PrismaClient>;
    const audit = new AiPlatformAuditService(new AuditService(prisma));
    agents = new ExternalAgentService(prisma, audit);
    credentials = new AgentCredentialService(prisma, audit);
    grants = new AgentGrantService(prisma, audit);
    authenticator = new AgentAuthenticatorService(prisma);

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
      const grantIds = await prisma.externalAgentCapabilityGrant.findMany({
        where: { agentId: { in: createdAgentIds } },
        select: { id: true },
      });
      const scopeIds = await prisma.externalAgentResourceScope.findMany({
        where: { agentId: { in: createdAgentIds } },
        select: { id: true },
      });
      await prisma.auditLog.deleteMany({
        where: {
          entityId: {
            in: [
              ...createdAgentIds,
              ...credentialIds.map((row) => row.id),
              ...grantIds.map((row) => row.id),
              ...scopeIds.map((row) => row.id),
            ],
          },
        },
      });
      await prisma.externalAgent.deleteMany({ where: { id: { in: createdAgentIds } } });
    }
    await prisma.$disconnect();
  });

  it('issues a credential, authenticates, then persists grant and scope', async () => {
    const agent = await agents.create(
      { name: 'foundation-smoke', ownerId: employeeId },
      employeeId,
    );
    createdAgentIds.push(agent.id);

    const issued = await credentials.issue({ agentId: agent.id }, employeeId);
    const authenticated = await authenticator.authenticate(issued.token, { channel: 'rest' });
    expect(authenticated.agentId).toBe(agent.id);
    expect(authenticated.agentState).toBe('ACTIVE');

    const grant = await grants.grantCapability(
      { agentId: agent.id, capabilityKey: 'tasks.read' },
      employeeId,
    );
    const again = await grants.grantCapability(
      { agentId: agent.id, capabilityKey: 'tasks.read' },
      employeeId,
    );
    expect(again.id).toBe(grant.id);

    const workspace = await prisma.workSpace.findFirst({
      where: { type: { not: 'EXTENSION_DELIVERY' } },
      select: { id: true },
    });
    const scopeId = workspace?.id ?? agent.id;
    const scope = await grants.grantScope(
      { agentId: agent.id, scopeType: 'WORKSPACE', scopeId },
      employeeId,
    );
    expect(scope.scopeId).toBe(scopeId);

    const listed = await grants.listCapabilities(agent.id);
    expect(listed.some((row) => row.capabilityKey === 'tasks.read' && !row.revokedAt)).toBe(true);
    const scopes = await grants.listScopes(agent.id);
    expect(scopes.some((row) => row.scopeId === scopeId && !row.revokedAt)).toBe(true);
  }, 60_000);

  it('never deadlocks grant or scope against agent revoke', async () => {
    const deadlocks: unknown[] = [];

    for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
      const agent = await agents.create(
        { name: `grant-revoke-probe-${attempt}`, ownerId: employeeId },
        employeeId,
      );
      createdAgentIds.push(agent.id);

      const outcomes = await Promise.allSettled([
        grants.grantCapability({ agentId: agent.id, capabilityKey: 'tasks.read' }, employeeId),
        grants.grantScope(
          { agentId: agent.id, scopeType: 'WORKSPACE', scopeId: agent.id },
          employeeId,
        ),
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
});
