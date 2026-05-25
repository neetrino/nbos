import { BadRequestException } from '@nestjs/common';
import { PrismaClient, SprintStatusEnum, TaskPlanningStatusEnum } from '@nbos/database';
import { derivePlanningStatusFromSprint } from './task-sprint-planning-sync';

export async function resolveTaskSprintAssignment(
  prisma: InstanceType<typeof PrismaClient>,
  params: {
    workspaceId: string | null | undefined;
    sprintId?: string | null;
    planningStatus?: string;
  },
): Promise<{ sprintId: string | null; planningStatus: TaskPlanningStatusEnum }> {
  if (params.sprintId === null || params.sprintId === '') {
    return {
      sprintId: null,
      planningStatus:
        normalizePlanningStatus(params.planningStatus) ?? TaskPlanningStatusEnum.BACKLOG,
    };
  }

  if (params.sprintId === undefined) {
    if (params.planningStatus) {
      return {
        sprintId: null,
        planningStatus: normalizePlanningStatus(params.planningStatus)!,
      };
    }
    return { sprintId: null, planningStatus: derivePlanningStatusFromSprint(null) };
  }

  if (!params.workspaceId) {
    throw new BadRequestException('workspaceId is required when assigning a sprint.');
  }

  const sprint = await prisma.sprint.findFirst({
    where: { id: params.sprintId, workspaceId: params.workspaceId },
    select: { id: true, status: true },
  });
  if (!sprint) throw new BadRequestException('Sprint not found in this Work Space.');
  if (sprint.status === SprintStatusEnum.CLOSED) {
    throw new BadRequestException('Cannot assign tasks to a closed sprint.');
  }

  return {
    sprintId: sprint.id,
    planningStatus: derivePlanningStatusFromSprint(sprint),
  };
}

function normalizePlanningStatus(raw: string | undefined): TaskPlanningStatusEnum | undefined {
  if (!raw?.trim()) return undefined;
  const v = raw.trim();
  const allowed = Object.values(TaskPlanningStatusEnum);
  if (!allowed.includes(v as TaskPlanningStatusEnum)) {
    throw new BadRequestException(`Invalid planningStatus: ${v}`);
  }
  return v as TaskPlanningStatusEnum;
}
