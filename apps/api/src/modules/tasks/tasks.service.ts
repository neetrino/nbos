import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type InputJsonValue,
  type TaskStatusEnum,
  type TaskPriorityEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { buildTaskCompletionBlockers, normalizeTaskCompletionRules } from './task-completion-rules';
import { taskFindAllPaginated } from './task-find-all-paginated.op';
import { TASK_DETAIL_INCLUDE, TASK_INCLUDE } from './task-response-includes';

interface CreateTaskDto {
  title: string;
  creatorId: string;
  description?: string;
  assigneeId?: string;
  coAssignees?: string[];
  observers?: string[];
  priority?: string;
  workspaceId?: string;
  planningStatus?: string;
  completionRules?: unknown;
  startDate?: string;
  dueDate?: string;
  parentId?: string;
  links?: Array<{ entityType: string; entityId: string }>;
}

interface UpdateTaskDto {
  title?: string;
  description?: string;
  assigneeId?: string | null;
  coAssignees?: string[];
  observers?: string[];
  priority?: string;
  startDate?: string | null;
  dueDate?: string | null;
  parentId?: string | null;
  kanbanStageId?: string | null;
  myPlanStageId?: string | null;
  myPlanSortOrder?: number;
  workspaceId?: string | null;
  planningStatus?: string;
  workspaceSortOrder?: number;
  completionRules?: unknown;
}

interface TaskQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  assigneeId?: string;
  creatorId?: string;
  workspaceId?: string;
  planningStatus?: string;
  parentId?: string;
  hasParent?: boolean;
  entityType?: string;
  entityId?: string;
  /** When set, restricts tasks to this project (delivery + workspace + PROJECT links). */
  projectId?: string;
  /** Requires `projectId`. Keeps tasks tied to this order only. */
  orderId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class TasksService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: TaskQueryParams) {
    return taskFindAllPaginated(this.prisma, params, {
      base: TASK_INCLUDE,
      projectScoped: TASK_DETAIL_INCLUDE,
    });
  }

  async findById(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        ...TASK_DETAIL_INCLUDE,
        parent: { select: { id: true, code: true, title: true } },
      },
    });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.prisma.task.findMany({
      where: { links: { some: { entityType, entityId } } },
      include: TASK_DETAIL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateTaskDto) {
    const code = await this.generateCode();
    const task = await this.prisma.task.create({
      data: {
        code,
        title: data.title,
        creatorId: data.creatorId,
        description: data.description,
        assigneeId: data.assigneeId,
        coAssignees: data.coAssignees ?? [],
        observers: data.observers ?? [],
        priority: (data.priority as TaskPriorityEnum) ?? 'NORMAL',
        workspaceId: data.workspaceId,
        ...(data.planningStatus && {
          planningStatus: data.planningStatus as Prisma.TaskCreateInput['planningStatus'],
        }),
        ...(data.completionRules !== undefined && {
          completionRules: this.parseCompletionRules(data.completionRules),
        }),
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        parentId: data.parentId,
        ...(data.links?.length && {
          links: {
            createMany: {
              data: data.links.map((l) => ({
                entityType: l.entityType,
                entityId: l.entityId,
              })),
            },
          },
        }),
      },
      include: TASK_DETAIL_INCLUDE,
    });
    return task;
  }

  async update(id: string, data: UpdateTaskDto) {
    await this.findById(id);
    return this.prisma.task.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
        ...(data.coAssignees && { coAssignees: data.coAssignees }),
        ...(data.observers && { observers: data.observers }),
        ...(data.priority && { priority: data.priority as TaskPriorityEnum }),
        ...(data.startDate !== undefined && {
          startDate: data.startDate ? new Date(data.startDate) : null,
        }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.kanbanStageId !== undefined && { kanbanStageId: data.kanbanStageId }),
        ...(data.myPlanStageId !== undefined && { myPlanStageId: data.myPlanStageId }),
        ...(data.myPlanSortOrder !== undefined && { myPlanSortOrder: data.myPlanSortOrder }),
        ...(data.workspaceId !== undefined && { workspaceId: data.workspaceId }),
        ...(data.planningStatus !== undefined && {
          planningStatus: data.planningStatus as Prisma.TaskUpdateInput['planningStatus'],
        }),
        ...(data.workspaceSortOrder !== undefined && {
          workspaceSortOrder: data.workspaceSortOrder,
        }),
        ...(data.completionRules !== undefined && {
          completionRules: this.parseCompletionRules(data.completionRules),
        }),
      },
      include: TASK_DETAIL_INCLUDE,
    });
  }

  /** Начать задачу */
  async start(id: string) {
    const task = await this.findById(id);
    if (task.status === 'COMPLETED' || task.status === 'DONE' || task.status === 'CANCELLED') {
      throw new NotFoundException('Cannot start a completed/cancelled task');
    }
    return this.prisma.task.update({
      where: { id },
      data: { status: 'IN_PROGRESS' as TaskStatusEnum },
      include: TASK_DETAIL_INCLUDE,
    });
  }

  /** Завершить задачу */
  async complete(id: string) {
    const task = await this.findById(id);
    const blockers = buildTaskCompletionBlockers(task);
    if (blockers.length > 0) {
      throw new BadRequestException({
        message: 'Task completion blocked.',
        blockers,
      });
    }
    return this.prisma.task.update({
      where: { id },
      data: {
        status: 'COMPLETED' as TaskStatusEnum,
        completedAt: new Date(),
      },
      include: TASK_DETAIL_INCLUDE,
    });
  }

  /** Возобновить задачу */
  async reopen(id: string) {
    await this.findById(id);
    return this.prisma.task.update({
      where: { id },
      data: {
        status: 'OPEN' as TaskStatusEnum,
        completedAt: null,
      },
      include: TASK_DETAIL_INCLUDE,
    });
  }

  /** Отложить задачу */
  async defer(id: string) {
    await this.findById(id);
    return this.prisma.task.update({
      where: { id },
      data: { status: 'DEFERRED' as TaskStatusEnum },
      include: TASK_DETAIL_INCLUDE,
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.task.delete({ where: { id } });
  }

  // ─── LINKS ───────────────────────────────────────────────

  async addLink(taskId: string, entityType: string, entityId: string) {
    await this.findById(taskId);
    return this.prisma.taskLink.create({
      data: { taskId, entityType, entityId },
    });
  }

  async removeLink(taskId: string, linkId: string) {
    return this.prisma.taskLink.delete({
      where: { id: linkId, taskId },
    });
  }

  // ─── CHECKLISTS ──────────────────────────────────────────

  async createChecklist(taskId: string, title: string) {
    await this.findById(taskId);
    return this.prisma.taskChecklist.create({
      data: { taskId, title },
      include: { items: true },
    });
  }

  async addChecklistItem(checklistId: string, text: string) {
    const maxOrder = await this.prisma.taskChecklistItem.aggregate({
      where: { checklistId },
      _max: { sortOrder: true },
    });
    return this.prisma.taskChecklistItem.create({
      data: {
        checklistId,
        text,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });
  }

  async toggleChecklistItem(itemId: string) {
    const item = await this.prisma.taskChecklistItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException(`Checklist item ${itemId} not found`);
    return this.prisma.taskChecklistItem.update({
      where: { id: itemId },
      data: { checked: !item.checked },
    });
  }

  async deleteChecklistItem(itemId: string) {
    return this.prisma.taskChecklistItem.delete({ where: { id: itemId } });
  }

  async deleteChecklist(checklistId: string) {
    return this.prisma.taskChecklist.delete({ where: { id: checklistId } });
  }

  private parseCompletionRules(input: unknown): InputJsonValue | undefined {
    if (input === null) return undefined;
    try {
      return normalizeTaskCompletionRules(input) as unknown as InputJsonValue;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid completionRules.';
      throw new BadRequestException(message);
    }
  }

  // ─── STATS ───────────────────────────────────────────────

  async getStats() {
    const [byStatus, byPriority] = await Promise.all([
      this.prisma.task.groupBy({ by: ['status'], _count: true }),
      this.prisma.task.groupBy({ by: ['priority'], _count: true }),
    ]);
    return { byStatus, byPriority };
  }

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.prisma.task.findFirst({
      where: { code: { startsWith: `T-${year}-` } },
      orderBy: { code: 'desc' },
    });
    const nextNum = last ? parseInt(last.code.split('-')[2] ?? '0', 10) + 1 : 1;
    return `T-${year}-${String(nextNum).padStart(4, '0')}`;
  }
}
