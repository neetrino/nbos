import type { PrismaClient } from '@nbos/database';
import {
  MESSENGER_WS_SERVER_CONVERSATION_TYPING,
  messengerSocketConversationRoom,
} from '@nbos/shared';
import type { Socket } from 'socket.io';
import { employeeMayUseCoreConversation } from './core/messenger-core-read-authorize';
import { messengerTypingDisplayLabel } from './messenger-gateway-channel-access';
import { extractConversationId } from './messenger-gateway-parse';
import type { MessengerTypingThrottle } from './messenger-typing-throttle';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function handleCoreConversationTyping(
  prisma: PrismaLike,
  client: Socket,
  employeeId: string | undefined,
  body: unknown,
  throttle: MessengerTypingThrottle,
): Promise<{ ok: boolean }> {
  if (!employeeId) return { ok: false };
  const conversationId = extractConversationId(body);
  if (!conversationId) return { ok: false };
  if (!(await employeeMayUseCoreConversation(prisma, employeeId, conversationId))) {
    return { ok: false };
  }
  if (!throttle.allow(client.id)) return { ok: true };
  const label = await messengerTypingDisplayLabel(prisma, employeeId);
  client
    .to(messengerSocketConversationRoom(conversationId))
    .emit(MESSENGER_WS_SERVER_CONVERSATION_TYPING, { conversationId, employeeId, label });
  return { ok: true };
}
