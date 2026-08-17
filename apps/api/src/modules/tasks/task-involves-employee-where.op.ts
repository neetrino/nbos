import type { Prisma } from '@nbos/database';
import { buildTaskProjectParticipationWhere } from './task-project-list-filter.ops';

/**
 * Personal mark on a task: assignee, co-assignee, observer, reviewer, or creator.
 * Task workflow status does not matter. Project-team membership is not a personal mark.
 */
export function taskDirectInvolvementClauses(scopedEmployeeIds: string[]): Prisma.TaskWhereInput[] {
  return [
    { assigneeId: { in: scopedEmployeeIds } },
    { creatorId: { in: scopedEmployeeIds } },
    { reviewerId: { in: scopedEmployeeIds } },
    { coAssignees: { hasSome: scopedEmployeeIds } },
    { observers: { hasSome: scopedEmployeeIds } },
  ];
}

/** Tasks the viewer may open via RBAC OWN: personal marks or project/product/workspace graph. */
export function buildTasksParticipationWhere(scopedEmployeeIds: string[]): Prisma.TaskWhereInput {
  const projectParticipation = buildTaskProjectParticipationWhere(scopedEmployeeIds);
  const projectClauses = (projectParticipation.OR ?? []) as Prisma.TaskWhereInput[];
  return {
    OR: [...taskDirectInvolvementClauses(scopedEmployeeIds), ...projectClauses],
  };
}

/** Top-level «свои» / My Plan: only tasks where the employee is marked, any status. */
export function taskWhereInvolvesEmployee(employeeId: string): Prisma.TaskWhereInput {
  return { OR: taskDirectInvolvementClauses([employeeId]) };
}
