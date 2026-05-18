import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, SprintStatusEnum, TaskPlanningStatusEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { closeActiveSprint } from './work-space-sprint-close.op';
import { moveTaskToSprintMembership } from './work-space-sprint-task-move.op';
import { parseUnfinishedSprintTaskAction } from './work-space-sprints.constants';

const SPRINT_LIST_INCLUDE = {
  _count: { select: { tasks: true } },
} as const;

interface CreateSprintDto {
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

interface UpdateSprintDto {
  name?: string;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

@Injectable()
export class WorkSpaceSprintsService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async list(workspaceId: string) {
    await this.requireScrumWorkspace(workspaceId);
    return this.prisma.sprint.findMany({
      where: { workspaceId },
      include: SPRINT_LIST_INCLUDE,
      orderBy: [{ status: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(workspaceId: string, data: CreateSprintDto) {
    await this.requireScrumWorkspace(workspaceId);
    const name = data.name?.trim();
    if (!name) throw new BadRequestException('name is required');

    const maxOrder = await this.prisma.sprint.aggregate({
      where: { workspaceId },
      _max: { sortOrder: true },
    });

    return this.prisma.sprint.create({
      data: {
        workspaceId,
        name,
        goal: data.goal?.trim() || undefined,
        startDate: this.parseOptionalDate(data.startDate),
        endDate: this.parseOptionalDate(data.endDate),
        status: SprintStatusEnum.PLANNING,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
      include: SPRINT_LIST_INCLUDE,
    });
  }

  async update(workspaceId: string, sprintId: string, data: UpdateSprintDto) {
    const sprint = await this.getSprintOrThrow(workspaceId, sprintId);
    if (sprint.status === SprintStatusEnum.CLOSED) {
      throw new BadRequestException('Closed sprints cannot be edited.');
    }

    return this.prisma.sprint.update({
      where: { id: sprintId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.goal !== undefined && { goal: data.goal }),
        ...(data.startDate !== undefined && {
          startDate: data.startDate ? new Date(data.startDate) : null,
        }),
        ...(data.endDate !== undefined && {
          endDate: data.endDate ? new Date(data.endDate) : null,
        }),
      },
      include: SPRINT_LIST_INCLUDE,
    });
  }

  async start(workspaceId: string, sprintId: string) {
    const sprint = await this.getSprintOrThrow(workspaceId, sprintId);
    if (sprint.status !== SprintStatusEnum.PLANNING) {
      throw new BadRequestException('Only planning sprints can be started.');
    }

    const otherActive = await this.prisma.sprint.findFirst({
      where: { workspaceId, status: SprintStatusEnum.ACTIVE, id: { not: sprintId } },
    });
    if (otherActive) {
      throw new BadRequestException('Close the current active sprint before starting another one.');
    }

    await this.prisma.$transaction([
      this.prisma.sprint.update({
        where: { id: sprintId },
        data: {
          status: SprintStatusEnum.ACTIVE,
          startDate: sprint.startDate ?? new Date(),
        },
      }),
      this.prisma.task.updateMany({
        where: { sprintId },
        data: { planningStatus: TaskPlanningStatusEnum.ACTIVE_SPRINT },
      }),
    ]);

    return this.prisma.sprint.findUnique({
      where: { id: sprintId },
      include: SPRINT_LIST_INCLUDE,
    });
  }

  async close(
    workspaceId: string,
    sprintId: string,
    body: { unfinishedTaskAction?: string; nextSprintId?: string },
  ) {
    const action = parseUnfinishedSprintTaskAction(body.unfinishedTaskAction ?? 'BACKLOG');
    try {
      return await closeActiveSprint(this.prisma, {
        workspaceId,
        sprintId,
        unfinishedTaskAction: action,
        nextSprintId: body.nextSprintId,
      });
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Invalid unfinishedTaskAction')) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }

  async moveTask(workspaceId: string, taskId: string, sprintId: string | null) {
    await this.requireScrumWorkspace(workspaceId);
    return moveTaskToSprintMembership(this.prisma, { workspaceId, taskId, sprintId });
  }

  private async requireScrumWorkspace(workspaceId: string) {
    const ws = await this.prisma.workSpace.findUnique({
      where: { id: workspaceId },
      select: { scrumEnabled: true },
    });
    if (!ws) throw new NotFoundException(`Work Space ${workspaceId} not found`);
    if (!ws.scrumEnabled) {
      throw new BadRequestException('Sprints are only available in scrum-enabled Work Spaces.');
    }
  }

  private async getSprintOrThrow(workspaceId: string, sprintId: string) {
    await this.requireScrumWorkspace(workspaceId);
    const sprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId, workspaceId },
    });
    if (!sprint) throw new NotFoundException(`Sprint ${sprintId} not found`);
    return sprint;
  }

  private parseOptionalDate(value: string | undefined): Date | undefined {
    if (!value?.trim()) return undefined;
    const d = new Date(value.trim());
    if (Number.isNaN(d.getTime())) throw new BadRequestException('Invalid date');
    return d;
  }
}
