import { BadRequestException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type TaskPriorityEnum,
  type TaskStatusEnum,
} from '@nbos/database';
import {
  assertOrderBelongsToProject,
  buildOrderTaskScopeWhere,
  buildProjectTaskScopeWhere,
} from './task-project-list-filter.ops';
import { assertProjectTasksAccessible } from './task-project-access.op';
import { taskWhereInvolvesEmployee } from './task-involves-employee-where.op';
import { buildTaskListSearchWhere } from './task-list-search-where.op';
import type { TasksAccessContext } from './tasks-scoped-access';
import { resolveSortField, normalizeSortDirection } from '../../common/utils/sort-order';

const TASK_SORT_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'dueDate',
  'priority',
  'status',
  'title',
]);

export interface TaskFindAllPaginatedParams {
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
  projectId?: string;
  orderId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  /** When set, only tasks where this employee is assignee, creator, co-assignee, or observer. */
  involvesEmployeeId?: string;
  /** When `projectId` is set, gates list to projects the viewer participates in (unless TASKS_VIEW is ALL). */
  access?: TasksAccessContext;
}

export async function taskFindAllPaginated(
  prisma: InstanceType<typeof PrismaClient>,
  params: TaskFindAllPaginatedParams,
  includes: { base: Prisma.TaskInclude; projectScoped: Prisma.TaskInclude },
): Promise<{
  items: Prisma.TaskGetPayload<{ include: Prisma.TaskInclude }>[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}> {
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

  const parts: Prisma.TaskWhereInput[] = [];
  if (status) parts.push({ status: status as TaskStatusEnum });
  if (priority) parts.push({ priority: priority as TaskPriorityEnum });
  if (assigneeId) parts.push({ assigneeId });
  if (creatorId) parts.push({ creatorId });
  if (params.workspaceId) parts.push({ workspaceId: params.workspaceId });
  if (params.planningStatus) {
    parts.push({
      planningStatus: params.planningStatus as Prisma.TaskWhereInput['planningStatus'],
    });
  }
  if (parentId) parts.push({ parentId });
  if (hasParent === false) parts.push({ parentId: null });
  if (entityType && entityId) {
    parts.push({ links: { some: { entityType, entityId } } });
  }
  if (params.involvesEmployeeId) {
    parts.push(taskWhereInvolvesEmployee(params.involvesEmployeeId));
  }
  const searchTrimmed = search?.trim();
  if (searchTrimmed) {
    parts.push(buildTaskListSearchWhere(searchTrimmed));
  }

  if (params.orderId && !params.projectId) {
    throw new BadRequestException('orderId requires projectId');
  }
  if (params.projectId) {
    await assertProjectTasksAccessible(prisma, params.projectId, params.access);
    parts.push(buildProjectTaskScopeWhere(params.projectId));
  }
  if (params.orderId) {
    await assertOrderBelongsToProject(prisma, params.orderId, params.projectId!);
    parts.push(buildOrderTaskScopeWhere(params.orderId));
  }

  const where: Prisma.TaskWhereInput =
    parts.length === 0 ? {} : parts.length === 1 ? parts[0]! : { AND: parts };

  const include = params.projectId ? includes.projectScoped : includes.base;

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include,
      orderBy: {
        [resolveSortField(sortBy, TASK_SORT_FIELDS, 'createdAt')]:
          normalizeSortDirection(sortOrder),
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.task.count({ where }),
  ]);

  return {
    items,
    meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  };
}
