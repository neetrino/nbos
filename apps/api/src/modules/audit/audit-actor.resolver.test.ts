import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Prisma } from '@nbos/database';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { attachActorsToAuditLogs, type AuditActorLookups } from './audit-actor.resolver';

type AuditLogRow = Prisma.AuditLogModel;

function row(overrides: Partial<AuditLogRow>): AuditLogRow {
  return {
    id: 'log-1',
    userId: null,
    actorType: null,
    actorId: null,
    entityType: 'Task',
    entityId: 'task-1',
    action: 'UPDATE',
    createdAt: new Date('2026-08-21T00:00:00.000Z'),
    ...overrides,
  } as AuditLogRow;
}

describe('attachActorsToAuditLogs', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it('resolves machine display names in one batched call per actor type', async () => {
    const resolveExternalAgentDisplayNames = vi.fn().mockResolvedValue(
      new Map([
        ['agent-1', 'Cursor Agent'],
        ['agent-2', 'Ops Bot'],
      ]),
    );
    const lookups: AuditActorLookups = { resolveExternalAgentDisplayNames };

    const logs = await attachActorsToAuditLogs(
      prisma as never,
      [
        row({ id: 'log-1', actorType: 'EXTERNAL_AGENT', actorId: 'agent-1' }),
        row({ id: 'log-2', actorType: 'EXTERNAL_AGENT', actorId: 'agent-2' }),
        row({ id: 'log-3', actorType: 'EXTERNAL_AGENT', actorId: 'agent-1' }),
      ],
      lookups,
    );

    expect(resolveExternalAgentDisplayNames).toHaveBeenCalledTimes(1);
    expect(resolveExternalAgentDisplayNames).toHaveBeenCalledWith(['agent-1', 'agent-2']);
    expect(logs.map((log) => log.actor?.displayName)).toEqual([
      'Cursor Agent',
      'Ops Bot',
      'Cursor Agent',
    ]);
  });

  it('falls back to the generic actor label when a machine name is unresolved', async () => {
    const logs = await attachActorsToAuditLogs(
      prisma as never,
      [row({ actorType: 'EXTERNAL_AGENT', actorId: 'agent-deleted' })],
      { resolveExternalAgentDisplayNames: vi.fn().mockResolvedValue(new Map()) },
    );

    expect(logs[0]!.actor).toMatchObject({ id: 'agent-deleted', type: 'EXTERNAL_AGENT' });
    expect(logs[0]!.actor?.displayName).toBeTruthy();
  });

  it('works with no lookups registered at all', async () => {
    const logs = await attachActorsToAuditLogs(prisma as never, [
      row({ actorType: 'EXTERNAL_AGENT', actorId: 'agent-1' }),
    ]);

    expect(logs[0]!.actor?.type).toBe('EXTERNAL_AGENT');
    expect(prisma.employee.findMany).not.toHaveBeenCalled();
  });

  it('keeps resolving employees from a single query alongside machine actors', async () => {
    prisma.employee.findMany.mockResolvedValue([
      { id: 'emp-1', firstName: 'Ann', lastName: 'Smith' },
    ]);

    const logs = await attachActorsToAuditLogs(
      prisma as never,
      [
        row({ id: 'log-1', userId: 'emp-1' }),
        row({ id: 'log-2', actorType: 'EXTERNAL_AGENT', actorId: 'agent-1' }),
        row({ id: 'log-3', userId: 'emp-1', actorType: 'USER', actorId: 'emp-1' }),
      ],
      { resolveExternalAgentDisplayNames: vi.fn().mockResolvedValue(new Map()) },
    );

    expect(prisma.employee.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.employee.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ['emp-1'] } } }),
    );
    expect(logs[0]!.actor).toMatchObject({ type: 'USER', displayName: 'Ann Smith' });
    expect(logs[1]!.actor?.type).toBe('EXTERNAL_AGENT');
  });

  it('returns a null actor for rows with no identity at all', async () => {
    const logs = await attachActorsToAuditLogs(prisma as never, [row({})]);
    expect(logs[0]!.actor).toBeNull();
  });
});
