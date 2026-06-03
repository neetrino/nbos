import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { assertTaskAccessible } from './task-access.op';

describe('assertTaskAccessible', () => {
  const prisma = {
    task: { findFirst: vi.fn() },
    employeeDepartment: { findMany: vi.fn() },
  };

  it('skips when TASKS_VIEW is ALL', async () => {
    await assertTaskAccessible(prisma as never, 't1', {
      employeeId: 'emp-1',
      departmentIds: [],
      viewScope: 'ALL',
    });
    expect(prisma.task.findFirst).not.toHaveBeenCalled();
  });

  it('throws when task is outside participation graph', async () => {
    prisma.task.findFirst.mockResolvedValue(null);
    await expect(
      assertTaskAccessible(prisma as never, 't1', {
        employeeId: 'emp-1',
        departmentIds: [],
        viewScope: 'OWN',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
