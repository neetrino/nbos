import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import type { FinanceScopedAccessContext } from '../finance/finance-scoped-access';
import {
  assertClientServiceAccessible,
  buildClientServiceParticipationWhere,
} from './client-service-access.op';

const OWN: FinanceScopedAccessContext = {
  employeeId: 'emp-1',
  departmentIds: [],
  viewScope: 'OWN',
};

const DEPARTMENT: FinanceScopedAccessContext = {
  employeeId: 'emp-1',
  departmentIds: ['dept-1'],
  viewScope: 'DEPARTMENT',
};

describe('client-service access', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.employeeDepartment.findMany.mockResolvedValue([]);
  });

  it('no-ops when view scope is ALL', async () => {
    await assertClientServiceAccessible(prisma as never, 'svc-1', {
      employeeId: 'emp-1',
      departmentIds: [],
      viewScope: 'ALL',
    });
    expect(prisma.clientServiceRecord.findFirst).not.toHaveBeenCalled();
  });

  it('hides a guessed id from an OWN caller', async () => {
    prisma.clientServiceRecord.findFirst.mockResolvedValue(null);
    await expect(
      assertClientServiceAccessible(prisma as never, 'guessed-record-id', OWN),
    ).rejects.toThrow(NotFoundException);
  });

  it('does not treat NONE as ALL', async () => {
    prisma.clientServiceRecord.findFirst.mockResolvedValue(null);
    await expect(
      assertClientServiceAccessible(prisma as never, 'svc-1', {
        employeeId: 'emp-1',
        departmentIds: [],
        viewScope: 'NONE',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.clientServiceRecord.findFirst).toHaveBeenCalled();
  });

  it('expands DEPARTMENT to department colleagues', async () => {
    prisma.employeeDepartment.findMany.mockResolvedValue([
      { employeeId: 'emp-1' },
      { employeeId: 'colleague-1' },
    ]);
    prisma.clientServiceRecord.findFirst.mockResolvedValue({ id: 'svc-1' });

    await assertClientServiceAccessible(prisma as never, 'svc-1', DEPARTMENT);

    const call = prisma.clientServiceRecord.findFirst.mock.calls[0]?.[0] as {
      where?: unknown;
    };
    expect(JSON.stringify(call?.where)).toContain('colleague-1');
  });

  it('requires project participation and excludes unassigned rows', () => {
    const where = buildClientServiceParticipationWhere(['emp-1']);
    expect(where.project).toBeDefined();
    expect(where).not.toHaveProperty('projectId');
    expect(JSON.stringify(where)).not.toContain('"projectId":null');
  });

  it('keeps seller roles on the deal graph', () => {
    const where = buildClientServiceParticipationWhere(['emp-1'], true);
    expect(where.project).toEqual({
      orders: { some: { deal: expect.objectContaining({ OR: expect.any(Array) }) } },
    });
    expect(JSON.stringify(where)).not.toContain('teamMembers');
  });
});
