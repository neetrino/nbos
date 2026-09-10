import type { PrismaClient } from '@nbos/database';
import type { TasksAccessContext } from '../../tasks/tasks-scoped-access';
import {
  createMessengerGrantSnapshot,
  type MessengerGrantSnapshot,
} from './messenger-core-grant-epoch';
import {
  createMessengerTaskAclSnapshot,
  type MessengerTaskAclSnapshot,
} from './messenger-core-task-acl-epoch';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type MessengerInternalAccessSnapshot = {
  grants: MessengerGrantSnapshot;
  tasks: MessengerTaskAclSnapshot;
};

export async function createMessengerInternalAccessSnapshot(
  prisma: PrismaLike,
  employeeId: string,
  tasksAccess?: TasksAccessContext,
): Promise<MessengerInternalAccessSnapshot> {
  const [grants, tasks] = await Promise.all([
    createMessengerGrantSnapshot(prisma, employeeId, 'INTERNAL'),
    createMessengerTaskAclSnapshot(prisma, tasksAccess),
  ]);
  return { grants, tasks };
}
