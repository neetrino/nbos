import { BadRequestException } from '@nestjs/common';
import { PrismaClient, SprintStatusEnum } from '@nbos/database';
import { derivePlanningStatusFromSprint } from './task-sprint-planning-sync';

export async function moveTaskToSprintMembership(
  prisma: InstanceType<typeof PrismaClient>,
  params: {
    workspaceId: string;
    taskId: string;
    sprintId: string | null;
  },
) {
  const task = await prisma.task.findFirst({
    where: { id: params.taskId, workspaceId: params.workspaceId },
    select: { id: true },
  });
  if (!task) {
    throw new BadRequestException('Task not found in this Work Space.');
  }

  const sprint = params.sprintId
    ? await prisma.sprint.findFirst({
        where: { id: params.sprintId, workspaceId: params.workspaceId },
        select: { id: true, status: true },
      })
    : null;
  if (params.sprintId && !sprint) {
    throw new BadRequestException('Sprint not found in this Work Space.');
  }
  if (sprint?.status === SprintStatusEnum.CLOSED) {
    throw new BadRequestException('Cannot assign tasks to a closed sprint.');
  }

  return prisma.task.update({
    where: { id: params.taskId },
    data: {
      sprintId: params.sprintId,
      planningStatus: derivePlanningStatusFromSprint(sprint),
    },
  });
}
