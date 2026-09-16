import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import type { FinanceScopedAccessContext } from '../finance/finance-scoped-access';
import {
  assertExpensePlanAccessible,
  buildExpensePlanParticipationWhere,
} from './expense-plan-access.op';

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

describe('expense-plan access', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.employeeDepartment.findMany.mockResolvedValue([]);
  });

  it('no-ops when view scope is ALL', async () => {
    await assertExpensePlanAccessible(prisma as never, 'plan-1', {
      employeeId: 'emp-1',
      departmentIds: [],
      viewScope: 'ALL',
    });
    expect(prisma.expensePlan.findFirst).not.toHaveBeenCalled();
  });

  it('hides a guessed id from an OWN caller', async () => {
    prisma.expensePlan.findFirst.mockResolvedValue(null);
    await expect(
      assertExpensePlanAccessible(prisma as never, 'guessed-record-id', OWN),
    ).rejects.toThrow(NotFoundException);
  });

  it('does not treat NONE as ALL', async () => {
    prisma.expensePlan.findFirst.mockResolvedValue(null);
    await expect(
      assertExpensePlanAccessible(prisma as never, 'plan-1', {
        employeeId: 'emp-1',
        departmentIds: [],
        viewScope: 'NONE',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.expensePlan.findFirst).toHaveBeenCalled();
  });

  it('expands DEPARTMENT to department colleagues', async () => {
    prisma.employeeDepartment.findMany.mockResolvedValue([
      { employeeId: 'emp-1' },
      { employeeId: 'colleague-1' },
    ]);
    prisma.expensePlan.findFirst.mockResolvedValue({ id: 'plan-1' });

    await assertExpensePlanAccessible(prisma as never, 'plan-1', DEPARTMENT);

    const call = prisma.expensePlan.findFirst.mock.calls[0]?.[0] as { where?: unknown };
    expect(JSON.stringify(call?.where)).toContain('colleague-1');
  });

  it('requires project participation and excludes unassigned rows', () => {
    const where = buildExpensePlanParticipationWhere(['emp-1']);
    expect(where.project).toBeDefined();
    expect(where).not.toHaveProperty('projectId');
    expect(JSON.stringify(where)).not.toContain('"projectId":null');
  });

  it('keeps seller roles on the deal graph', () => {
    const where = buildExpensePlanParticipationWhere(['emp-1'], true);
    expect(where.project).toEqual({
      orders: { some: { deal: expect.objectContaining({ OR: expect.any(Array) }) } },
    });
    expect(JSON.stringify(where)).not.toContain('teamMembers');
  });
});
