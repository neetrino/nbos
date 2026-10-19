import { describe, it, expect, beforeEach } from 'vitest';
import { overlayViewerMyPlanPlacement } from './overlay-viewer-my-plan-placement.op';
import { createMockPrisma } from '../../test-utils/mock-prisma';

describe('overlayViewerMyPlanPlacement', () => {
  const prisma = createMockPrisma();

  beforeEach(() => {
    prisma.taskMyPlanPlacement.findMany.mockReset().mockResolvedValue([]);
  });

  it('leaves an empty list unchanged', async () => {
    const items: Array<{ id: string }> = [];
    await overlayViewerMyPlanPlacement(prisma as never, items, 'emp-1');
    expect(prisma.taskMyPlanPlacement.findMany).not.toHaveBeenCalled();
  });

  it('clears legacy task columns when the viewer is missing', async () => {
    const items = [{ id: 't1', myPlanStageId: 'legacy', myPlanSortOrder: 9 }];
    await overlayViewerMyPlanPlacement(prisma as never, items);
    expect(items[0]).toEqual({ id: 't1', myPlanStageId: null, myPlanSortOrder: 0 });
    expect(prisma.taskMyPlanPlacement.findMany).not.toHaveBeenCalled();
  });

  it('overlays only the viewer row and treats a missing row as Unassigned', async () => {
    prisma.taskMyPlanPlacement.findMany.mockResolvedValue([
      { taskId: 't1', stageId: 'me-today', sortOrder: 2 },
    ]);
    const items = [
      { id: 't1', myPlanStageId: 'legacy', myPlanSortOrder: 9 },
      { id: 't2', myPlanStageId: 'legacy', myPlanSortOrder: 4 },
    ];

    await overlayViewerMyPlanPlacement(prisma as never, items, 'emp-me');

    expect(prisma.taskMyPlanPlacement.findMany).toHaveBeenCalledWith({
      where: { employeeId: 'emp-me', taskId: { in: ['t1', 't2'] } },
      select: { taskId: true, stageId: true, sortOrder: true },
    });
    expect(items[0]).toEqual({ id: 't1', myPlanStageId: 'me-today', myPlanSortOrder: 2 });
    expect(items[1]).toEqual({ id: 't2', myPlanStageId: null, myPlanSortOrder: 0 });
  });
});
