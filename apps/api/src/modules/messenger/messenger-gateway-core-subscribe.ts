import type { PrismaClient } from '@nbos/database';
import { messengerSocketConversationRoom } from '@nbos/shared';
import { employeeMayUseCoreConversation } from './core/messenger-core-read-authorize';
import { extractConversationId } from './messenger-gateway-parse';

type PrismaLike = InstanceType<typeof PrismaClient>;

export { employeeMayUseCoreConversation, extractConversationId };

export async function subscribeSocketToCoreConversation(
  prisma: PrismaLike,
  employeeId: string | undefined,
  body: unknown,
  join: (room: string) => void | Promise<void>,
): Promise<{ ok: boolean }> {
  if (!employeeId) return { ok: false };
  const conversationId = extractConversationId(body);
  if (!conversationId) return { ok: false };
  if (!(await employeeMayUseCoreConversation(prisma, employeeId, conversationId))) {
    return { ok: false };
  }
  await join(messengerSocketConversationRoom(conversationId));
  return { ok: true };
}

/**
 * Leaves only the conversation room derived from a validated body.
 * Never touches `messenger:user:{employeeId}`.
 */
export async function leaveSocketCoreConversation(
  employeeId: string | undefined,
  body: unknown,
  leave: (room: string) => void | Promise<void>,
): Promise<{ ok: boolean }> {
  if (!employeeId) return { ok: false };
  const conversationId = extractConversationId(body);
  if (!conversationId) return { ok: false };
  await leave(messengerSocketConversationRoom(conversationId));
  return { ok: true };
}
