import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import type { FinanceScopedAccessContext } from '../finance/finance-scoped-access';
import {
  calledWheres,
  whereAllowsUnassignedProject,
  whereRequiresProjectParticipation,
} from '../finance/finance-permission-test-support';
import { ExpensePlansService } from './expense-plans.service';

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

function expectScopedWheres(fn: { mock: { calls: ReadonlyArray<readonly unknown[]> } }): void {
  const wheres = calledWheres(fn);
  expect(wheres.length).toBeGreaterThan(0);
  for (const where of wheres) {
    expect(whereRequiresProjectParticipation(where, ['emp-1'])).toBe(true);
    expect(whereAllowsUnassignedProject(where)).toBe(false);
  }
}

describe('ExpensePlansService row scope', () => {
  let service: ExpensePlansService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.employeeDepartment.findMany.mockResolvedValue([]);
    service = new ExpensePlansService(
      prisma as never,
      { create: async () => ({ id: 'exp-1' }) } as never,
    );
  });

  it('scopes list and grid for OWN, including unassigned plans', async () => {
    await service.findAll({ access: OWN });
    await service.getGrid({ access: OWN, year: 2026 });

    expectScopedWheres(prisma.expensePlan.findMany);
    expectScopedWheres(prisma.expensePlan.count);
  });

  it('does not leak colleague-only rows into DEPARTMENT grid counts', async () => {
    prisma.employeeDepartment.findMany.mockResolvedValue([
      { employeeId: 'emp-1' },
      { employeeId: 'colleague-1' },
    ]);

    await service.getGrid({ access: DEPARTMENT, year: 2026 });

    const [where] = calledWheres(prisma.expensePlan.findMany);
    expect(whereRequiresProjectParticipation(where, ['emp-1', 'colleague-1'])).toBe(true);
    expect(whereAllowsUnassignedProject(where)).toBe(false);
  });

  it('does not apply a row filter at ALL', async () => {
    await service.findAll({
      access: { employeeId: 'emp-1', departmentIds: [], viewScope: 'ALL' },
    });

    const [where] = calledWheres(prisma.expensePlan.findMany);
    expect(whereRequiresProjectParticipation(where, ['emp-1'])).toBe(false);
  });
});
