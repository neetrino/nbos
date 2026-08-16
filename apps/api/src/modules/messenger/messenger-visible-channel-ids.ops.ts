import type { PrismaClient } from '@nbos/database';
import {
  canAccessMessengerChannel,
  loadMessengerLegacyAccess,
  type MessengerLegacyAccessContext,
} from './access/messenger-legacy-channel-access.op';

/**
 * Channel ids the viewer may see in search and listings (Phase 4 ACL).
 */
export async function listMessengerVisibleChannelIds(
  prisma: InstanceType<typeof PrismaClient>,
  viewerEmployeeId: string,
  access?: MessengerLegacyAccessContext | null,
): Promise<string[]> {
  const resolved =
    access === undefined ? await loadMessengerLegacyAccess(prisma, viewerEmployeeId) : access;
  if (!resolved || resolved.viewScope === 'NONE') return [];

  const rows = await prisma.messengerChannel.findMany({
    select: { id: true, projectId: true, type: true },
    orderBy: { createdAt: 'asc' },
  });

  const visible: string[] = [];
  for (const row of rows) {
    if (await canAccessMessengerChannel(prisma, resolved, row)) {
      visible.push(row.id);
    }
  }
  return visible;
}
