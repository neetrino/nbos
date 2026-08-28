import { TaskPlanningStatusEnum, type Prisma } from '@nbos/database';
import type { EntityLifecycleScope } from '@nbos/shared';

const SCRUM_PLANNING_STATUSES: TaskPlanningStatusEnum[] = [
  TaskPlanningStatusEnum.BACKLOG,
  TaskPlanningStatusEnum.FUTURE_SPRINT,
];

/**
 * Global personal `/tasks` feed: hide scrum workspace backlog / future sprint.
 * Workspace lists, explicit planningStatus filters, and trash keep those rows.
 */
export function shouldExcludeScrumPlanningFromGlobalFeed(params: {
  involvesEmployeeId?: string;
  workspaceId?: string;
  planningStatus?: string;
  scope?: EntityLifecycleScope;
}): boolean {
  if (!params.involvesEmployeeId) return false;
  if (params.workspaceId) return false;
  if (params.planningStatus) return false;
  if (params.scope === 'trash') return false;
  return true;
}

/** Prisma predicate: not (scrum-enabled workspace AND backlog/future sprint). */
export function buildExcludeScrumPlanningWhere(): Prisma.TaskWhereInput {
  return {
    NOT: {
      AND: [
        { workspace: { is: { scrumEnabled: true } } },
        { planningStatus: { in: SCRUM_PLANNING_STATUSES } },
      ],
    },
  };
}
