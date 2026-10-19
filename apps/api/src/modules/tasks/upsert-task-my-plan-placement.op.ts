import { BadRequestException } from '@nestjs/common';
import type { TasksDbClient } from './tasks-db-client';

const MY_PLAN_BOARD_TYPE = 'MY_PLAN' as const;
const UNASSIGNED_MY_PLAN_STAGE_KEY = '__unassigned';

export type UpsertTaskMyPlanPlacementInput = {
  taskId: string;
  employeeId: string;
  stageId?: string | null;
  sortOrder?: number;
};

/**
 * Writes the current employee's My Plan column and/or sort slot.
 * A non-null stage must be a MY_PLAN column owned by that employee.
 */
export async function upsertTaskMyPlanPlacement(
  db: TasksDbClient,
  input: UpsertTaskMyPlanPlacementInput,
): Promise<void> {
  const employeeId = input.employeeId.trim();
  if (!employeeId) {
    throw new BadRequestException('My Plan placement requires the current employee');
  }

  const stageId = normalizeOptionalStageId(input.stageId);
  if (stageId) {
    await assertOwnedMyPlanStage(db, stageId, employeeId);
  }

  await db.taskMyPlanPlacement.upsert({
    where: { taskId_employeeId: { taskId: input.taskId, employeeId } },
    create: {
      taskId: input.taskId,
      employeeId,
      stageId: stageId ?? null,
      sortOrder: input.sortOrder ?? 0,
    },
    update: {
      ...(stageId !== undefined && { stageId }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
    },
  });
}

function normalizeOptionalStageId(stageId: string | null | undefined): string | null | undefined {
  if (stageId === undefined) return undefined;
  if (stageId === null) return null;
  const trimmed = stageId.trim();
  if (trimmed.length === 0 || trimmed === UNASSIGNED_MY_PLAN_STAGE_KEY) return null;
  return trimmed;
}

async function assertOwnedMyPlanStage(
  db: TasksDbClient,
  stageId: string,
  employeeId: string,
): Promise<void> {
  const stage = await db.taskBoardStage.findUnique({
    where: { id: stageId },
    select: { id: true, boardType: true, ownerId: true },
  });
  if (!stage || stage.boardType !== MY_PLAN_BOARD_TYPE || stage.ownerId !== employeeId) {
    throw new BadRequestException('My Plan stage does not belong to the current employee');
  }
}
