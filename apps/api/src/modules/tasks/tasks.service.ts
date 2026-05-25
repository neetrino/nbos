import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type InputJsonValue,
  type TaskStatusEnum,
  TaskPlanningStatusEnum,
  TaskPriorityEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { buildTaskCompletionBlockers, normalizeTaskCompletionRules } from './task-completion-rules';
import { formatTaskCode, nextTaskCodeNumericSuffix } from './task-code-generation';
import { taskFindAllPaginated } from './task-find-all-paginated.op';
import { taskWhereInvolvesEmployee } from './task-involves-employee-where.op';
import { attachTaskLinkDisplayNames } from './task-link-display-names.op';
import { TASK_DETAIL_INCLUDE, TASK_INCLUDE } from './task-response-includes';
import { NotificationService } from '../notifications/notification.service';
import { notifyTaskReviewRequested } from './task-review-notify.op';
import { resolveTaskSprintAssignment } from './task-sprint-assign.op';

interface CreateTaskDto {
  title: string;
  creatorId: string;
  description?: string;
  assigneeId?: string;
  coAssignees?: string[];
  observers?: string[];
  priority?: string;
  workspaceId?: string;
  sprintId?: string | null;
  planningStatus?: string;
  completionRules?: unknown;
  dueDate?: string;
  parentId?: string;
  links?: Array<{ entityType: string; entityId: string }>;
}

interface UpdateTaskDto {
  title?: string;
  description?: string;
  creatorId?: string;
  assigneeId?: string | null;
  coAssignees?: string[];
  observers?: string[];
  priority?: string;
  dueDate?: string | null;
  parentId?: string | null;
  myPlanStageId?: string | null;
  myPlanSortOrder?: number;
  workspaceId?: string | null;
  sprintId?: string | null;
  planningStatus?: string;
  workspaceSortOrder?: number;
  completionRules?: unknown;
  status?: string;
  reviewerId?: string | null;
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
  involvesEmployeeId?: string;
}

@Injectable()
export class TasksService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly notifications: NotificationService,
  ) {}

  async findAll(params: TaskQueryParams) {
    const result = await taskFindAllPaginated(this.prisma, params, {
      base: TASK_INCLUDE,
      projectScoped: TASK_DETAIL_INCLUDE,
    });
    await attachTaskLinkDisplayNames(this.prisma, result.items);
    return result;
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
    await attachTaskLinkDisplayNames(this.prisma, [task]);
    return task;
  }

  async findByEntity(entityType: string, entityId: string) {
    const items = await this.prisma.task.findMany({
      where: { links: { some: { entityType, entityId } } },
      include: TASK_DETAIL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    await attachTaskLinkDisplayNames(this.prisma, items);
    return items;
  }

  async create(data: CreateTaskDto) {
    const title = data.title?.trim();
    if (!title) throw new BadRequestException('title is required');
    const creatorId = data.creatorId?.trim();
    if (!creatorId) throw new BadRequestException('creatorId is required');

    const workspaceId = data.workspaceId?.trim() || undefined;
    const assigneeId = data.assigneeId?.trim() || undefined;
    const parentId = data.parentId?.trim() || undefined;
    const priority = this.normalizeCreatePriority(data.priority);
    const sprintAssignment = await resolveTaskSprintAssignment(this.prisma, {
      workspaceId,
      sprintId: data.sprintId,
      planningStatus: data.planningStatus,
    });
    const dueDate = this.parseOptionalIsoDate('dueDate', data.dueDate);
    const linkRows = this.dedupeTaskLinks(data.links);

    const code = await this.generateCode();
    const task = await this.prisma.task.create({
      data: {
        code,
        title,
        creatorId,
        description: data.description?.trim() || undefined,
        assigneeId,
        coAssignees: data.coAssignees ?? [],
        observers: data.observers ?? [],
        priority,
        workspaceId,
        sprintId: sprintAssignment.sprintId,
        planningStatus: sprintAssignment.planningStatus,
        ...(data.completionRules !== undefined && {
          completionRules: this.parseCompletionRules(data.completionRules),
        }),
        dueDate,
        parentId,
        ...(linkRows?.length && {
          links: {
            createMany: {
              data: linkRows.map((l) => ({
                entityType: l.entityType,
                entityId: l.entityId,
              })),
            },
          },
        }),
      },
      include: TASK_INCLUDE,
    });
    await attachTaskLinkDisplayNames(this.prisma, [task]);
    return task;
  }

  async update(id: string, data: UpdateTaskDto) {
    const existing = await this.findById(id);
    if (data.creatorId !== undefined) {
      const creatorId = data.creatorId.trim();
      if (!creatorId) throw new BadRequestException('creatorId is required');
      const found = await this.prisma.employee.count({ where: { id: creatorId } });
      if (found !== 1) throw new BadRequestException('Creator employee was not found.');
    }
    const sprintAssignment =
      data.sprintId !== undefined || data.planningStatus !== undefined
        ? await resolveTaskSprintAssignment(this.prisma, {
            workspaceId: data.workspaceId ?? existing.workspaceId,
            sprintId: data.sprintId,
            planningStatus: data.planningStatus,
          })
        : null;

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.creatorId !== undefined && { creatorId: data.creatorId.trim() }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
        ...(data.coAssignees && { coAssignees: data.coAssignees }),
        ...(data.observers && { observers: data.observers }),
        ...(data.priority && {
          priority: data.priority as (typeof TaskPriorityEnum)[keyof typeof TaskPriorityEnum],
        }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.myPlanStageId !== undefined && { myPlanStageId: data.myPlanStageId }),
        ...(data.myPlanSortOrder !== undefined && { myPlanSortOrder: data.myPlanSortOrder }),
        ...(data.workspaceId !== undefined && { workspaceId: data.workspaceId }),
        ...(sprintAssignment && {
          sprintId: sprintAssignment.sprintId,
          planningStatus: sprintAssignment.planningStatus,
        }),
        ...(data.planningStatus !== undefined &&
          !sprintAssignment && {
            planningStatus: data.planningStatus as Prisma.TaskUpdateInput['planningStatus'],
          }),
        ...(data.workspaceSortOrder !== undefined && {
          workspaceSortOrder: data.workspaceSortOrder,
        }),
        ...(data.completionRules !== undefined && {
          completionRules: this.parseCompletionRules(data.completionRules),
        }),
        ...(data.status !== undefined && {
          status: data.status as TaskStatusEnum,
        }),
        ...(data.reviewerId !== undefined && { reviewerId: data.reviewerId }),
      },
      include: TASK_DETAIL_INCLUDE,
    });
    await attachTaskLinkDisplayNames(this.prisma, [task]);
    return task;
  }

  /** Move task to Review (work done, awaiting approval). */
  async submitForReview(id: string, reviewerId?: string) {
    const task = await this.findById(id);
    if (task.status === 'COMPLETED') {
      throw new BadRequestException('Completed tasks cannot be submitted for review.');
    }
    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        status: 'REVIEW',
        reviewRequestedAt: new Date(),
        reviewApprovedAt: null,
        ...(reviewerId !== undefined && { reviewerId: reviewerId || null }),
      },
      include: TASK_DETAIL_INCLUDE,
    });
    await attachTaskLinkDisplayNames(this.prisma, [updated]);
    await notifyTaskReviewRequested(this.notifications, {
      taskId: updated.id,
      taskCode: updated.code,
      taskTitle: updated.title,
      reviewerId: updated.reviewerId,
      assigneeId: updated.assigneeId,
    }).catch(() => undefined);
    return updated;
  }

  /** Approve review so completion rules can pass. */
  async approveReview(id: string) {
    const task = await this.findById(id);
    if (task.status !== 'REVIEW') {
      throw new BadRequestException('Task is not in Review status.');
    }
    const updated = await this.prisma.task.update({
      where: { id },
      data: { reviewApprovedAt: new Date() },
      include: TASK_DETAIL_INCLUDE,
    });
    await attachTaskLinkDisplayNames(this.prisma, [updated]);
    return updated;
  }

  /** Send back to In Progress after review. */
  async requestReviewChanges(id: string) {
    const task = await this.findById(id);
    if (task.status !== 'REVIEW') {
      throw new BadRequestException('Task is not in Review status.');
    }
    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        reviewApprovedAt: null,
        reviewRequestedAt: null,
      },
      include: TASK_DETAIL_INCLUDE,
    });
    await attachTaskLinkDisplayNames(this.prisma, [updated]);
    return updated;
  }

  /** Начать задачу */
  async start(id: string) {
    const task = await this.findById(id);
    if (task.status === 'COMPLETED') {
      throw new NotFoundException('Cannot start a completed task');
    }
    const updated = await this.prisma.task.update({
      where: { id },
      data: { status: 'IN_PROGRESS' as TaskStatusEnum },
      include: TASK_DETAIL_INCLUDE,
    });
    await attachTaskLinkDisplayNames(this.prisma, [updated]);
    return updated;
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
    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        status: 'COMPLETED' as TaskStatusEnum,
        completedAt: new Date(),
      },
      include: TASK_DETAIL_INCLUDE,
    });
    await attachTaskLinkDisplayNames(this.prisma, [updated]);
    return updated;
  }

  /** Возобновить задачу */
  async reopen(id: string) {
    await this.findById(id);
    const reopened = await this.prisma.task.update({
      where: { id },
      data: {
        status: 'OPEN' as TaskStatusEnum,
        completedAt: null,
      },
      include: TASK_DETAIL_INCLUDE,
    });
    await attachTaskLinkDisplayNames(this.prisma, [reopened]);
    return reopened;
  }

  /** Pause task (On hold) */
  async setOnHold(id: string) {
    await this.findById(id);
    const onHold = await this.prisma.task.update({
      where: { id },
      data: { status: 'ON_HOLD' as TaskStatusEnum },
      include: TASK_DETAIL_INCLUDE,
    });
    await attachTaskLinkDisplayNames(this.prisma, [onHold]);
    return onHold;
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

  private normalizeCreatePriority(
    raw: string | undefined,
  ): (typeof TaskPriorityEnum)[keyof typeof TaskPriorityEnum] {
    const v = raw?.trim();
    const allowed = Object.values(TaskPriorityEnum);
    if (v && allowed.includes(v as (typeof TaskPriorityEnum)[keyof typeof TaskPriorityEnum])) {
      return v as (typeof TaskPriorityEnum)[keyof typeof TaskPriorityEnum];
    }
    return TaskPriorityEnum.NORMAL;
  }

  private normalizeCreatePlanningStatus(
    raw: string | undefined,
  ): Prisma.TaskCreateInput['planningStatus'] | undefined {
    if (raw === undefined || raw === null || !String(raw).trim()) return undefined;
    const v = String(raw).trim();
    const allowed = Object.values(TaskPlanningStatusEnum);
    if (
      !allowed.includes(v as (typeof TaskPlanningStatusEnum)[keyof typeof TaskPlanningStatusEnum])
    ) {
      throw new BadRequestException(`Invalid planningStatus: ${v}`);
    }
    return v as Prisma.TaskCreateInput['planningStatus'];
  }

  private parseOptionalIsoDate(field: 'dueDate', value: string | undefined): Date | undefined {
    if (value === undefined || value === null || !String(value).trim()) return undefined;
    const d = new Date(String(value).trim());
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException(`Invalid ${field}`);
    }
    return d;
  }

  private dedupeTaskLinks(
    links: CreateTaskDto['links'] | undefined,
  ): Array<{ entityType: string; entityId: string }> | undefined {
    if (!links?.length) return undefined;
    const map = new Map<string, { entityType: string; entityId: string }>();
    for (const l of links) {
      const entityType = l.entityType?.trim();
      const entityId = l.entityId?.trim();
      if (!entityType || !entityId) continue;
      map.set(`${entityType}:${entityId}`, { entityType, entityId });
    }
    const out = [...map.values()];
    return out.length ? out : undefined;
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

  async getStats(involvesEmployeeId?: string) {
    const participantWhere = involvesEmployeeId
      ? taskWhereInvolvesEmployee(involvesEmployeeId)
      : undefined;
    const groupArgs = {
      _count: true as const,
      ...(participantWhere ? { where: participantWhere } : {}),
    };
    const [byStatus, byPriority] = await Promise.all([
      this.prisma.task.groupBy({ by: ['status'], ...groupArgs }),
      this.prisma.task.groupBy({ by: ['priority'], ...groupArgs }),
    ]);
    return { byStatus, byPriority };
  }

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `T-${year}-`;
    const rows = await this.prisma.task.findMany({
      where: { code: { startsWith: prefix } },
      select: { code: true },
    });
    const next = nextTaskCodeNumericSuffix(
      year,
      rows.map((r) => r.code),
    );
    return formatTaskCode(year, next);
  }
}
