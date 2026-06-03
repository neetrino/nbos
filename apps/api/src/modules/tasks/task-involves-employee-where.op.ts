import type { Prisma } from '@nbos/database';
import { buildTaskProjectParticipationWhere } from './task-project-list-filter.ops';

/** Direct assignee/creator/co-assignee/observer match (exported for workspace standalone gate). */
export function taskDirectInvolvementClauses(scopedEmployeeIds: string[]): Prisma.TaskWhereInput[] {
  return [
    { assigneeId: { in: scopedEmployeeIds } },
    { creatorId: { in: scopedEmployeeIds } },
    { coAssignees: { hasSome: scopedEmployeeIds } },
    { observers: { hasSome: scopedEmployeeIds } },
  ];
}

/** Tasks where any scoped employee participates directly or via project/product/workspace graph. */
export function buildTasksParticipationWhere(scopedEmployeeIds: string[]): Prisma.TaskWhereInput {
  const projectParticipation = buildTaskProjectParticipationWhere(scopedEmployeeIds);
  const projectClauses = (projectParticipation.OR ?? []) as Prisma.TaskWhereInput[];
  return {
    OR: [...taskDirectInvolvementClauses(scopedEmployeeIds), ...projectClauses],
  };
}

/** Tasks where the employee participates directly or via project/product team. */
export function taskWhereInvolvesEmployee(employeeId: string): Prisma.TaskWhereInput {
  return buildTasksParticipationWhere([employeeId]);
}
