import { PrismaClient } from '@nbos/database';
import { loadMessengerLegacyAccess } from '../access/messenger-legacy-channel-access.op';
import { listAccessibleInternalConversationsByIds } from './messenger-core-internal-list.ops';
import type { MessengerInternalConversationListItem } from './messenger-core-internal.types';
import type { TasksAccessContext } from '../../tasks/tasks-scoped-access';

type PrismaLike = InstanceType<typeof PrismaClient>;

/**
 * Canonical Internal inbox row for one conversation, using the same ACL as list/bootstrap.
 * Returns null when the viewer cannot see the conversation in Messenger.
 */
export async function loadAccessibleInternalConversationSummary(
  prisma: PrismaLike,
  employeeId: string,
  conversationId: string,
  tasksAccess?: TasksAccessContext,
): Promise<MessengerInternalConversationListItem | null> {
  const access = await loadMessengerLegacyAccess(prisma, employeeId);
  if (!access || access.viewScope === 'NONE') return null;
  const items = await listAccessibleInternalConversationsByIds(
    prisma,
    employeeId,
    access.viewScope,
    [conversationId],
    access.editScope,
    tasksAccess,
  );
  return items[0] ?? null;
}
