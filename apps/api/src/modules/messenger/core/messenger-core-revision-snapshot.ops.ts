import type { PrismaClient } from '@nbos/database';
import { revisionToCheckpoint } from './messenger-core-revision.constants';
import { runMessengerReadTx } from './messenger-core-revision-tx';
import { shareLockZoneRevision } from './messenger-core-revision-write.ops';
import type { MessengerConversationZone } from '@nbos/database';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function snapshotMessengerZoneRead<T>(
  prisma: PrismaLike,
  zone: MessengerConversationZone,
  read: (client: PrismaLike) => Promise<T>,
): Promise<{ checkpoint: string; value: T }> {
  const revision = await runMessengerReadTx(prisma, (tx) => shareLockZoneRevision(tx, zone));
  const value = await read(prisma);
  return { checkpoint: revisionToCheckpoint(revision), value };
}
