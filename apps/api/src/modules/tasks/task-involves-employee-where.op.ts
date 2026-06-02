import type { Prisma } from '@nbos/database';
import { buildProjectParticipationWhere } from '../platform-access/platform-team-graph.where';

/** Tasks where the employee participates directly or via project/product team. */
export function taskWhereInvolvesEmployee(employeeId: string): Prisma.TaskWhereInput {
  return {
    OR: [
      { assigneeId: employeeId },
      { creatorId: employeeId },
      { coAssignees: { has: employeeId } },
      { observers: { has: employeeId } },
      { project: buildProjectParticipationWhere([employeeId]) },
    ],
  };
}
