import { BadRequestException } from '@nestjs/common';
import { PrismaClient, SprintStatusEnum, TaskPlanningStatusEnum } from '@nbos/database';
import type { UnfinishedSprintTaskAction } from './work-space-sprints.constants';

const OPEN_TASK_STATUSES = ['OPEN', 'IN_PROGRESS', 'REVIEW', 'ON_HOLD'] as const;

export async function closeActiveSprint(
  prisma: InstanceType<typeof PrismaClient>,
  params: {
    workspaceId: string;
    sprintId: string;
    unfinishedTaskAction: UnfinishedSprintTaskAction;
    nextSprintId?: string;
  },
) {
  const sprint = await prisma.sprint.findFirst({
    where: { id: params.sprintId, workspaceId: params.workspaceId },
  });
  if (!sprint) throw new BadRequestException('Sprint not found.');
  if (sprint.status !== SprintStatusEnum.ACTIVE) {
    throw new BadRequestException('Only an active sprint can be closed.');
  }

  const unfinished = await prisma.task.findMany({
    where: {
      sprintId: sprint.id,
      status: { in: [...OPEN_TASK_STATUSES] },
    },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.sprint.update({
      where: { id: sprint.id },
      data: { status: SprintStatusEnum.CLOSED, closedAt: new Date() },
    });

    if (unfinished.length === 0) return;

    if (params.unfinishedTaskAction === 'KEEP') return;

    if (params.unfinishedTaskAction === 'BACKLOG') {
      await tx.task.updateMany({
        where: { id: { in: unfinished.map((t) => t.id) } },
        data: { sprintId: null, planningStatus: TaskPlanningStatusEnum.BACKLOG },
      });
      return;
    }

    const targetSprintId = await resolveNextPlanningSprintId(tx, params);
    await tx.task.updateMany({
      where: { id: { in: unfinished.map((t) => t.id) } },
      data: {
        sprintId: targetSprintId,
        planningStatus: TaskPlanningStatusEnum.FUTURE_SPRINT,
      },
    });
  });

  return prisma.sprint.findUnique({
    where: { id: sprint.id },
    include: { _count: { select: { tasks: true } } },
  });
}

async function resolveNextPlanningSprintId(
  tx: Omit<
    InstanceType<typeof PrismaClient>,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
  >,
  params: {
    workspaceId: string;
    nextSprintId?: string;
  },
): Promise<string> {
  if (params.nextSprintId) {
    const row = await tx.sprint.findFirst({
      where: {
        id: params.nextSprintId,
        workspaceId: params.workspaceId,
        status: SprintStatusEnum.PLANNING,
      },
    });
    if (!row) throw new BadRequestException('Target planning sprint not found.');
    return row.id;
  }

  const created = await tx.sprint.create({
    data: {
      workspaceId: params.workspaceId,
      name: 'Next sprint',
      status: SprintStatusEnum.PLANNING,
    },
  });
  return created.id;
}
