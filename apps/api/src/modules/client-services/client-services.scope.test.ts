import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import type { FinanceScopedAccessContext } from '../finance/finance-scoped-access';
import {
  calledWheres,
  whereAllowsUnassignedProject,
  whereRequiresProjectParticipation,
} from '../finance/finance-permission-test-support';
import { ClientServicesService } from './client-services.service';

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

describe('ClientServicesService row scope', () => {
  let service: ClientServicesService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.employeeDepartment.findMany.mockResolvedValue([]);
    prisma.clientServiceRecord.aggregate.mockResolvedValue({
      _count: { _all: 0 },
      _sum: { ourCost: null },
    });
    service = new ClientServicesService(prisma as never);
  });

  it('scopes list, board, and stats for OWN', async () => {
    await service.findAll({ access: OWN });
    await service.getBoard({ view: 'status', access: OWN });
    await service.getStats({ access: OWN });

    expectScopedWheres(prisma.clientServiceRecord.findMany);
    expectScopedWheres(prisma.clientServiceRecord.count);
    expectScopedWheres(prisma.clientServiceRecord.groupBy);
    expectScopedWheres(prisma.clientServiceRecord.aggregate);
  });

  it('does not leak colleague-only rows into DEPARTMENT aggregates', async () => {
    prisma.employeeDepartment.findMany.mockResolvedValue([
      { employeeId: 'emp-1' },
      { employeeId: 'colleague-1' },
    ]);

    await service.getStats({ access: DEPARTMENT });

    const wheres = calledWheres(prisma.clientServiceRecord.count);
    expect(wheres.length).toBeGreaterThan(0);
    for (const where of wheres) {
      expect(whereRequiresProjectParticipation(where, ['emp-1', 'colleague-1'])).toBe(true);
    }
  });

  it('does not apply a row filter at ALL', async () => {
    await service.findAll({
      access: { employeeId: 'emp-1', departmentIds: [], viewScope: 'ALL' },
    });

    const [where] = calledWheres(prisma.clientServiceRecord.findMany);
    expect(whereRequiresProjectParticipation(where, ['emp-1'])).toBe(false);
  });
});
