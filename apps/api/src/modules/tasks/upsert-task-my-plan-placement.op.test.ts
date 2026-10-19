import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { upsertTaskMyPlanPlacement } from './upsert-task-my-plan-placement.op';
import { createMockPrisma } from '../../test-utils/mock-prisma';

describe('upsertTaskMyPlanPlacement', () => {
  const prisma = createMockPrisma();

  beforeEach(() => {
    prisma.taskBoardStage.findUnique.mockReset();
    prisma.taskMyPlanPlacement.upsert.mockReset().mockResolvedValue({ id: 'p1' });
  });

  it('rejects a blank employee id', async () => {
    await expect(
      upsertTaskMyPlanPlacement(prisma as never, {
        taskId: 't1',
        employeeId: '  ',
        stageId: 'stage-1',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.taskMyPlanPlacement.upsert).not.toHaveBeenCalled();
  });

  it('rejects a stage owned by another employee', async () => {
    prisma.taskBoardStage.findUnique.mockResolvedValue({
      id: 'stage-me',
      boardType: 'MY_PLAN',
      ownerId: 'emp-me',
    });

    await expect(
      upsertTaskMyPlanPlacement(prisma as never, {
        taskId: 't1',
        employeeId: 'emp-karo',
        stageId: 'stage-me',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.taskMyPlanPlacement.upsert).not.toHaveBeenCalled();
  });

  it('upserts the current employee row for an owned stage', async () => {
    prisma.taskBoardStage.findUnique.mockResolvedValue({
      id: 'stage-karo',
      boardType: 'MY_PLAN',
      ownerId: 'emp-karo',
    });

    await upsertTaskMyPlanPlacement(prisma as never, {
      taskId: 't1',
      employeeId: 'emp-karo',
      stageId: 'stage-karo',
      sortOrder: 3,
    });

    expect(prisma.taskMyPlanPlacement.upsert).toHaveBeenCalledWith({
      where: { taskId_employeeId: { taskId: 't1', employeeId: 'emp-karo' } },
      create: {
        taskId: 't1',
        employeeId: 'emp-karo',
        stageId: 'stage-karo',
        sortOrder: 3,
      },
      update: { stageId: 'stage-karo', sortOrder: 3 },
    });
  });

  it('treats the board Unassigned key as a personal clear', async () => {
    await upsertTaskMyPlanPlacement(prisma as never, {
      taskId: 't1',
      employeeId: 'emp-me',
      stageId: '__unassigned',
    });

    expect(prisma.taskBoardStage.findUnique).not.toHaveBeenCalled();
    expect(prisma.taskMyPlanPlacement.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ employeeId: 'emp-me', stageId: null }),
        update: { stageId: null },
      }),
    );
  });

  it('clears only the current employee stage when stageId is null', async () => {
    await upsertTaskMyPlanPlacement(prisma as never, {
      taskId: 't1',
      employeeId: 'emp-me',
      stageId: null,
    });

    expect(prisma.taskBoardStage.findUnique).not.toHaveBeenCalled();
    expect(prisma.taskMyPlanPlacement.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ employeeId: 'emp-me', stageId: null }),
        update: { stageId: null },
      }),
    );
  });
});
