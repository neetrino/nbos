import type { PrismaClient } from '@nbos/database';
import type { MessengerWsZone } from '@nbos/shared';
import { resolveCoreConversationRead } from './messenger-core-read-authorize';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function evictIfCoreReadLost(
  prisma: PrismaLike,
  conversationId: string,
  employeeId: string,
  zone: MessengerWsZone,
  evict: (employeeId: string, conversationId: string, zone: MessengerWsZone) => Promise<void>,
): Promise<'evicted' | 'retained'> {
  const resolved = await resolveCoreConversationRead(prisma, employeeId, conversationId);
  if (resolved.status === 'OK') return 'retained';
  await evict(employeeId, conversationId, zone);
  return 'evicted';
}
