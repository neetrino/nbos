import { Logger } from '@nestjs/common';
import type { MessengerConversationType, PrismaClient } from '@nbos/database';
import type { Server } from 'socket.io';
import {
  MESSENGER_WS_SERVER_CONVERSATION_ACCESS_CHANGED,
  MESSENGER_WS_SERVER_CONVERSATION_MESSAGE,
  MESSENGER_WS_SERVER_CONVERSATION_SUMMARY,
  type MessengerWsZone,
  messengerSocketConversationRoom,
  messengerSocketUserRoom,
} from '@nbos/shared';
import {
  deriveRecipientConversationSummaries,
  type ConversationSummaryPublishInput,
} from './core/messenger-core-summary-recipients.ops';
import type { MessengerCoreMessageDto } from './core/messenger-core.types';
import type { MessengerPresenceTracker } from './messenger-presence-tracker';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type PersistedCoreMessageFacts = {
  zone: MessengerWsZone;
  conversationType?: MessengerConversationType;
};

export type PublishPersistedCoreMessageInput = {
  emitRoomMessage: (conversationId: string, message: MessengerCoreMessageDto) => void;
  scheduleSummaries: (
    payload: Omit<ConversationSummaryPublishInput, 'connectedEmployeeIds'>,
  ) => Promise<void>;
  loadFacts: (conversationId: string) => Promise<PersistedCoreMessageFacts | null>;
  logger: Logger;
  message: MessengerCoreMessageDto;
  knownFacts?: PersistedCoreMessageFacts;
};

/**
 * Room emit is synchronous. Recipient summary fanout is best-effort and must not
 * delay the caller. Failures are logged and swallowed.
 */
export function emitCoreConversationRoomMessage(
  server: Server | undefined,
  conversationId: string,
  message: MessengerCoreMessageDto,
): void {
  if (!server) return;
  server.to(messengerSocketConversationRoom(conversationId)).emit(
    MESSENGER_WS_SERVER_CONVERSATION_MESSAGE,
    { conversationId, message },
  );
}

export function publishPersistedCoreConversationMessage(
  input: PublishPersistedCoreMessageInput,
): void {
  input.emitRoomMessage(input.message.conversationId, input.message);
  void runPersistedSummaryFanout(input);
}

async function runPersistedSummaryFanout(
  input: PublishPersistedCoreMessageInput,
): Promise<void> {
  try {
    const facts =
      input.knownFacts ?? (await input.loadFacts(input.message.conversationId));
    if (!facts) return;
    await input.scheduleSummaries({
      conversationId: input.message.conversationId,
      zone: facts.zone,
      conversationType: facts.conversationType,
      senderId: input.message.senderId,
      lastMessageAt: input.message.createdAt,
      lastMessagePreview: input.message.content,
    });
  } catch (error) {
    input.logger.error('Failed to publish Core conversation summaries', error);
  }
}

export async function loadConversationPublishFacts(
  prisma: PrismaLike,
  conversationId: string,
): Promise<PersistedCoreMessageFacts | null> {
  const row = await prisma.messengerConversation.findUnique({
    where: { id: conversationId },
    select: { zone: true, type: true },
  });
  if (!row) return null;
  if (row.zone !== 'INTERNAL' && row.zone !== 'CLIENT') return null;
  return { zone: row.zone, conversationType: row.type };
}

export async function publishCoreConversationSummariesToConnected(input: {
  server: Server | undefined;
  prisma: PrismaLike;
  presenceTracker: MessengerPresenceTracker;
  logger: Logger;
  payload: Omit<ConversationSummaryPublishInput, 'connectedEmployeeIds'>;
}): Promise<void> {
  if (!input.server) return;
  try {
    const recipients = await deriveRecipientConversationSummaries(input.prisma, {
      ...input.payload,
      connectedEmployeeIds: input.presenceTracker.snapshotEmployeeIds(),
    });
    emitSummaryPayloads(input.server, recipients);
  } catch (error) {
    input.logger.error('Failed to publish Core conversation summaries', error);
  }
}

function emitSummaryPayloads(
  server: Server,
  recipients: Awaited<ReturnType<typeof deriveRecipientConversationSummaries>>,
): void {
  for (const recipient of recipients) {
    server
      .to(messengerSocketUserRoom(recipient.employeeId))
      .emit(MESSENGER_WS_SERVER_CONVERSATION_SUMMARY, recipient.payload);
  }
}

export async function evictEmployeeFromConversationRoom(
  server: Server | undefined,
  employeeId: string,
  conversationId: string,
  zone: MessengerWsZone,
): Promise<void> {
  if (!server) return;
  const conversationRoom = messengerSocketConversationRoom(conversationId);
  const userRoom = messengerSocketUserRoom(employeeId);
  const sockets = await server.in(userRoom).fetchSockets();
  await Promise.all(sockets.map((socket) => socket.leave(conversationRoom)));
  server.to(userRoom).emit(MESSENGER_WS_SERVER_CONVERSATION_ACCESS_CHANGED, {
    conversationId,
    zone,
  });
}
