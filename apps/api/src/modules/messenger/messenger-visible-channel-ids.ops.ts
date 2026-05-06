import type { PrismaClient } from '@nbos/database';

/**
 * Channel ids the viewer may see in search and listings.
 * Internal MVP: all messenger channels (aligned with `getChannels`). When project/channel ACL lands,
 * narrow here so search never leaks non-member channel text.
 */
export async function listMessengerVisibleChannelIds(
  prisma: InstanceType<typeof PrismaClient>,
  _viewerEmployeeId: string,
): Promise<string[]> {
  void _viewerEmployeeId;
  const rows = await prisma.messengerChannel.findMany({ select: { id: true } });
  return rows.map((r) => r.id);
}
