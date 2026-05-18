import { type Prisma } from '@nbos/database';

export const TASK_INCLUDE = {
  creator: { select: { id: true, firstName: true, lastName: true } },
  assignee: { select: { id: true, firstName: true, lastName: true } },
  reviewer: { select: { id: true, firstName: true, lastName: true } },
  links: true,
  checklists: { include: { items: { orderBy: { sortOrder: 'asc' as const } } } },
  subtasks: {
    select: { id: true, code: true, title: true, status: true, assigneeId: true },
    orderBy: { createdAt: 'asc' as const },
  },
  sprint: {
    select: {
      id: true,
      name: true,
      status: true,
      goal: true,
      startDate: true,
      endDate: true,
      closedAt: true,
    },
  },
  _count: { select: { subtasks: true, checklists: true } },
} satisfies Prisma.TaskInclude;

/** Product / extension / workspace + Order code for project lists and task detail. */
export const TASK_DETAIL_INCLUDE = {
  ...TASK_INCLUDE,
  product: { select: { id: true, name: true, order: { select: { id: true, code: true } } } },
  extension: {
    select: {
      id: true,
      name: true,
      order: { select: { id: true, code: true } },
      product: { select: { id: true, name: true } },
    },
  },
  workspace: {
    select: {
      id: true,
      name: true,
      product: { select: { id: true, name: true, order: { select: { id: true, code: true } } } },
      extension: {
        select: {
          id: true,
          name: true,
          order: { select: { id: true, code: true } },
          product: { select: { id: true, name: true } },
        },
      },
    },
  },
} satisfies Prisma.TaskInclude;
