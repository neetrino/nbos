import { ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { commitTaskUpdate } from './commit-task-update.op';

describe('commitTaskUpdate', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it('uses unconditional update when no expectedUpdatedAt is provided', async () => {
    prisma.task.update.mockResolvedValue({ id: 't1', title: 'A' });
    await commitTaskUpdate(prisma as never, {
      id: 't1',
      data: { title: 'A' },
      include: {},
    });
    expect(prisma.task.update).toHaveBeenCalled();
    expect(prisma.task.updateMany).not.toHaveBeenCalled();
  });

  it('conflicts when the optimistic updatedAt predicate matches no row', async () => {
    prisma.task.updateMany.mockResolvedValue({ count: 0 });
    const expectedUpdatedAt = new Date('2026-08-21T00:00:00.000Z');
    await expect(
      commitTaskUpdate(prisma as never, {
        id: 't1',
        data: { title: 'A' },
        include: {},
        expectedUpdatedAt,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.task.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 't1', updatedAt: expectedUpdatedAt, trashedAt: null },
      }),
    );
    expect(prisma.task.update).not.toHaveBeenCalled();
  });
});
