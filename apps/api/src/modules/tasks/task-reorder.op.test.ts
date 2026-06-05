import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { reorderTasks } from './task-reorder.op';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

vi.mock('./task-access.op', () => ({
  assertTaskAccessible: vi.fn().mockResolvedValue(undefined),
}));

describe('reorderTasks', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    vi.clearAllMocks();
  });

  it('throws when taskIds is empty', async () => {
    await expect(
      reorderTasks(prisma as never, { taskIds: [], scope: 'workspace' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws for invalid scope', async () => {
    await expect(
      reorderTasks(prisma as never, {
        taskIds: ['t1'],
        scope: 'invalid' as 'workspace',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('assigns workspaceSortOrder sequentially', async () => {
    await reorderTasks(prisma as never, {
      taskIds: ['t2', 't0', 't1'],
      scope: 'workspace',
    });

    expect(prisma.task.update).toHaveBeenCalledTimes(3);
    expect(prisma.task.update).toHaveBeenNthCalledWith(1, {
      where: { id: 't2' },
      data: { workspaceSortOrder: 0 },
    });
    expect(prisma.task.update).toHaveBeenNthCalledWith(3, {
      where: { id: 't1' },
      data: { workspaceSortOrder: 2 },
    });
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });

  it('assigns myPlanSortOrder for my-plan scope', async () => {
    await reorderTasks(prisma as never, {
      taskIds: ['t1'],
      scope: 'my-plan',
    });

    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { myPlanSortOrder: 0 },
    });
  });
});
