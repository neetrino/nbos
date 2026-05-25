import type { Prisma } from '@nbos/database';

/** Tasks where the employee participates (assignee, creator, co-assignee, or observer). */
export function taskWhereInvolvesEmployee(employeeId: string): Prisma.TaskWhereInput {
  return {
    OR: [
      { assigneeId: employeeId },
      { creatorId: employeeId },
      { coAssignees: { has: employeeId } },
      { observers: { has: employeeId } },
    ],
  };
}
