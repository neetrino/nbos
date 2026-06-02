import type { Prisma } from '@nbos/database';
import { buildTaskProjectParticipationWhere } from './task-project-list-filter.ops';

/** Tasks where the employee participates directly or via project/product team. */
export function taskWhereInvolvesEmployee(employeeId: string): Prisma.TaskWhereInput {
  const projectParticipation = buildTaskProjectParticipationWhere([employeeId]);
  const projectClauses = (projectParticipation.OR ?? []) as Prisma.TaskWhereInput[];
  return {
    OR: [
      { assigneeId: employeeId },
      { creatorId: employeeId },
      { coAssignees: { has: employeeId } },
      { observers: { has: employeeId } },
      ...projectClauses,
    ],
  };
}
