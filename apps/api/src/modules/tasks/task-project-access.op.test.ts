import { beforeEach, describe, expect, it } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { assertProjectTasksAccessible } from './task-project-access.op';

describe('assertProjectTasksAccessible', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it('skips check when TASKS_VIEW is ALL', async () => {
    await assertProjectTasksAccessible(prisma as never, 'proj-1', {
      employeeId: 'emp-1',
      departmentIds: [],
      viewScope: 'ALL',
    });
    expect(prisma.project.findFirst).not.toHaveBeenCalled();
  });

  it('throws when project is outside participation graph', async () => {
    prisma.project.findFirst.mockResolvedValue(null);
    await expect(
      assertProjectTasksAccessible(prisma as never, 'proj-1', {
        employeeId: 'emp-1',
        departmentIds: [],
        viewScope: 'ASSIGNED',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows when project matches team graph', async () => {
    prisma.project.findFirst.mockResolvedValue({ id: 'proj-1' });
    await assertProjectTasksAccessible(prisma as never, 'proj-1', {
      employeeId: 'emp-1',
      departmentIds: [],
      viewScope: 'ASSIGNED',
    });
    expect(prisma.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'proj-1' }),
      }),
    );
  });
});
