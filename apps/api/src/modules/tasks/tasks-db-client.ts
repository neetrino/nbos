import type { PrismaClient } from '@nbos/database';

/**
 * The client surface the Task read and write paths use.
 *
 * Deliberately a narrow `Pick` rather than `PrismaClient | TransactionClient`:
 * TypeScript exhausts its instantiation depth comparing those two full types,
 * and the resulting "excessive stack depth" errors are not fixable at the call
 * site. It is picked off `PrismaClient` rather than `TransactionClient` so the
 * generic arguments match the injected client exactly; an interactive
 * transaction client is structurally compatible either way.
 *
 * Narrowing also documents which models these paths may touch.
 */
export type TasksDbClient = Pick<
  InstanceType<typeof PrismaClient>,
  | 'task'
  | 'taskDiscussionEntry'
  | 'employee'
  | 'employeeDepartment'
  | 'sprint'
  | 'project'
  | 'product'
  | 'extension'
  | 'order'
  | 'deal'
  | 'lead'
>;
