import { createHash } from 'node:crypto';
import type { PrismaClient } from '@nbos/database';
import { buildTasksParticipationWhere } from '../../tasks/task-involves-employee-where.op';
import {
  loadTasksScopedEmployeeIds,
  tasksViewBypassesRowFilter,
  type TasksAccessContext,
} from '../../tasks/tasks-scoped-access';
import {
  MESSENGER_AUTHORIZATION_EPOCH_LENGTH,
  MESSENGER_TASK_ACL_ABSENT_SENTINEL,
  MESSENGER_TASK_ACL_BYPASS_SENTINEL,
} from './messenger-core-revision.constants';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type MessengerTaskAclSnapshot = {
  allowedTaskIds: string[] | null;
  digest: string;
};

/**
 * Fresh Task ACL snapshot for one HTTP operation. Never cached across calls.
 * Task IDs never leave the digest helper.
 */
export async function createMessengerTaskAclSnapshot(
  prisma: PrismaLike,
  tasksAccess: TasksAccessContext | undefined,
): Promise<MessengerTaskAclSnapshot> {
  if (!tasksAccess) {
    return { allowedTaskIds: null, digest: MESSENGER_TASK_ACL_ABSENT_SENTINEL };
  }
  const allowedTaskIds = await resolveAllowedTaskIds(prisma, tasksAccess);
  if (allowedTaskIds === null) {
    return { allowedTaskIds: null, digest: MESSENGER_TASK_ACL_BYPASS_SENTINEL };
  }
  return { allowedTaskIds, digest: digestTaskIdSet(allowedTaskIds) };
}

export async function loadMessengerTaskAclDigest(
  prisma: PrismaLike,
  tasksAccess: TasksAccessContext | undefined,
): Promise<string> {
  return (await createMessengerTaskAclSnapshot(prisma, tasksAccess)).digest;
}

export async function loadAllowedTaskIds(
  prisma: PrismaLike,
  tasksAccess: TasksAccessContext | undefined,
): Promise<string[] | null> {
  return (await createMessengerTaskAclSnapshot(prisma, tasksAccess)).allowedTaskIds;
}

export function digestTaskIdSet(taskIds: readonly string[]): string {
  const sorted = [...taskIds].sort();
  return createHash('sha256')
    .update(sorted.join(','))
    .digest('hex')
    .slice(0, MESSENGER_AUTHORIZATION_EPOCH_LENGTH);
}

async function resolveAllowedTaskIds(
  prisma: PrismaLike,
  tasksAccess: TasksAccessContext,
): Promise<string[] | null> {
  if (tasksViewBypassesRowFilter(tasksAccess.viewScope)) return null;
  const scopedIds = await loadTasksScopedEmployeeIds(prisma, tasksAccess);
  const rows = await prisma.task.findMany({
    where: { trashedAt: null, AND: [buildTasksParticipationWhere(scopedIds)] },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}
