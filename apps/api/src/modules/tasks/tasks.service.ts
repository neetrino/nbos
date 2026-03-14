import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type TaskStatusEnum,
  type TaskPriorityEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

interface CreateTaskDto {
  title: string;
  creatorId: string;
  description?: string;
  assigneeId?: string;
  coAssignees?: string[];
  observers?: string[];
  priority?: string;
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
}

interface TaskQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  assigneeId?: string;
  creatorId?: string;
  parentId?: string;
  hasParent?: boolean;
  entityType?: string;
  entityId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const TASK_INCLUDE = {
  creator: { select: { id: true, firstName: true, lastName: true } },
  assignee: { select: { id: true, firstName: true, lastName: true } },
  links: true,
  checklists: { include: { items: { orderBy: { sortOrder: 'asc' as const } } } },
  subtasks: {
    select: { id: true, code: true, title: true, status: true, assigneeId: true },
    orderBy: { createdAt: 'asc' as const },
  },
  _count: { select: { subtasks: true, checklists: true } },
} satisfies Prisma.TaskInclude;

@Injectable()
export class TasksService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: TaskQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      status,
      priority,
      assigneeId,
      creatorId,
      parentId,
      hasParent,
      entityType,
      entityId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.TaskWhereInput = {};
    if (status) where.status = status as TaskStatusEnum;
    if (priority) where.priority = priority as TaskPriorityEnum;
    if (assigneeId) where.assigneeId = assigneeId;
    if (creatorId) where.creatorId = creatorId;
    if (parentId) where.parentId = parentId;
    if (hasParent === false) where.parentId = null;
    if (entityType && entityId) {
      where.links = { some: { entityType, entityId } };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: TASK_INCLUDE,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        ...TASK_INCLUDE,
        parent: { select: { id: true, code: true, title: true } },
      },
    });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.prisma.task.findMany({
      where: { links: { some: { entityType, entityId } } },
      include: TASK_INCLUDE,
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
      include: TASK_INCLUDE,
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
      },
      include: TASK_INCLUDE,
    });
  }

  /** Начать задачу */
  async start(id: string) {
    const task = await this.findById(id);
    if (task.status === 'DONE' || task.status === 'CANCELLED') {
      throw new NotFoundException('Cannot start a completed/cancelled task');
    }
    return this.prisma.task.update({
      where: { id },
      data: { status: 'IN_PROGRESS' as TaskStatusEnum },
      include: TASK_INCLUDE,
    });
  }

  /** Завершить задачу */
  async complete(id: string) {
    await this.findById(id);
    return this.prisma.task.update({
      where: { id },
      data: {
        status: 'DONE' as TaskStatusEnum,
        completedAt: new Date(),
      },
      include: TASK_INCLUDE,
    });
  }

  /** Возобновить задачу */
  async reopen(id: string) {
    await this.findById(id);
    return this.prisma.task.update({
      where: { id },
      data: {
        status: 'NEW' as TaskStatusEnum,
        completedAt: null,
      },
      include: TASK_INCLUDE,
    });
  }

  /** Отложить задачу */
  async defer(id: string) {
    await this.findById(id);
    return this.prisma.task.update({
      where: { id },
      data: { status: 'DEFERRED' as TaskStatusEnum },
      include: TASK_INCLUDE,
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
