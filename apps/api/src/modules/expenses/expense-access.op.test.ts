import { describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { assertExpenseAccessible } from './expense-access.op';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('assertExpenseAccessible', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.employeeDepartment.findMany.mockResolvedValue([]);
  });

  it('no-ops when view scope is ALL', async () => {
    await assertExpenseAccessible(prisma as never, 'exp-1', {
      employeeId: 'emp-1',
      departmentIds: [],
      viewScope: 'ALL',
    });
    expect(prisma.expense.findFirst).not.toHaveBeenCalled();
  });

  it('throws when scoped user cannot see expense', async () => {
    prisma.expense.findFirst.mockResolvedValue(null);
    await expect(
      assertExpenseAccessible(prisma as never, 'exp-1', {
        employeeId: 'emp-1',
        departmentIds: [],
        viewScope: 'OWN',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('passes for payroll-linked rows without project participation', async () => {
    prisma.expense.findFirst.mockResolvedValue({ id: 'pay-1' });
    await assertExpenseAccessible(prisma as never, 'pay-1', {
      employeeId: 'emp-1',
      departmentIds: [],
      viewScope: 'OWN',
    });
    expect(prisma.expense.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([{ salaryLine: { isNot: null } }]),
        }),
      }),
    );
  });
});
