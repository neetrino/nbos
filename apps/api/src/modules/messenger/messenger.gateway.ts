import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { PrismaClient } from '@nbos/database';
import * as jwt from 'jsonwebtoken';
import type { Server, Socket } from 'socket.io';
import { PRISMA_TOKEN } from '../../database.module';
import {
  MESSENGER_SOCKET_NAMESPACE,
  MESSENGER_WS_CLIENT_SUBSCRIBE_CHANNEL,
  MESSENGER_WS_CLIENT_TYPING_CHANNEL,
  MESSENGER_WS_CLIENT_TYPING_DM,
  MESSENGER_WS_SERVER_CHANNEL_MESSAGE,
  MESSENGER_WS_SERVER_CHANNEL_TYPING,
  MESSENGER_WS_SERVER_DM_MESSAGE,
  MESSENGER_WS_SERVER_DM_TYPING,
  MESSENGER_WS_READ_UPDATED_SCOPE,
  MESSENGER_WS_SERVER_CHANNEL_PEER_READ,
  MESSENGER_WS_SERVER_DM_PEER_READ,
  MESSENGER_WS_SERVER_PRESENCE,
  MESSENGER_WS_SERVER_PRESENCE_SNAPSHOT,
  MESSENGER_WS_SERVER_READ_UPDATED,
  type MessengerWsChannelPeerReadPayload,
  type MessengerWsDmPeerReadPayload,
  messengerSocketChannelRoom,
  messengerSocketUserRoom,
} from '@nbos/shared';
import { MessengerPresenceTracker } from './messenger-presence-tracker';
import { MessengerTypingThrottle } from './messenger-typing-throttle';
import type { MessengerMessageDto } from './messenger.types';

interface JwtSubPayload {
  sub: string;
}

@WebSocketGateway({
  namespace: MESSENGER_SOCKET_NAMESPACE,
  cors: { origin: true, credentials: true },
})
export class MessengerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MessengerGateway.name);
  private readonly jwtSecret: string;
  private readonly typingThrottle = new MessengerTypingThrottle();
  private readonly presenceTracker = new MessengerPresenceTracker();

  constructor(
    private readonly configService: ConfigService,
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
  ) {
    this.jwtSecret = this.configService.getOrThrow<string>('JWT_SECRET');
  }

  handleConnection(client: Socket): void {
    void this.authenticateAndJoinUserRoom(client);
  }

  handleDisconnect(client: Socket): void {
    const employeeId = client.data.employeeId as string | undefined;
    if (!employeeId) return;
    const { becameOffline } = this.presenceTracker.decrement(employeeId);
    if (becameOffline) {
      this.server?.emit(MESSENGER_WS_SERVER_PRESENCE, {
        employeeId,
        state: 'offline' as const,
      });
    }
  }

  @SubscribeMessage(MESSENGER_WS_CLIENT_SUBSCRIBE_CHANNEL)
  async handleSubscribeChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<{ ok: boolean }> {
    const employeeId = client.data.employeeId as string | undefined;
    if (!employeeId) return { ok: false };
    const channelId = extractChannelId(body);
    if (!channelId) return { ok: false };
    const channel = await this.prisma.messengerChannel.findUnique({ where: { id: channelId } });
    if (!channel) return { ok: false };
    await client.join(messengerSocketChannelRoom(channelId));
    return { ok: true };
  }

  @SubscribeMessage(MESSENGER_WS_CLIENT_TYPING_CHANNEL)
  async handleTypingChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<{ ok: boolean }> {
    const employeeId = client.data.employeeId as string | undefined;
    if (!employeeId) return { ok: false };
    const channelId = extractChannelId(body);
    if (!channelId) return { ok: false };
    const channel = await this.prisma.messengerChannel.findUnique({ where: { id: channelId } });
    if (!channel) return { ok: false };
    if (!this.typingThrottle.allow(client.id)) return { ok: true };
    const label = await this.typingDisplayLabel(employeeId);
    client.to(messengerSocketChannelRoom(channelId)).emit(MESSENGER_WS_SERVER_CHANNEL_TYPING, {
      channelId,
      employeeId,
      label,
    });
    return { ok: true };
  }

  @SubscribeMessage(MESSENGER_WS_CLIENT_TYPING_DM)
  async handleTypingDm(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<{ ok: boolean }> {
    const employeeId = client.data.employeeId as string | undefined;
    if (!employeeId) return { ok: false };
    const recipientId = extractRecipientId(body);
    if (!recipientId || recipientId === employeeId) return { ok: false };
    if (!this.typingThrottle.allow(client.id)) return { ok: true };
    const label = await this.typingDisplayLabel(employeeId);
    client.to(messengerSocketUserRoom(recipientId)).emit(MESSENGER_WS_SERVER_DM_TYPING, {
      counterpartId: employeeId,
      employeeId,
      label,
    });
    return { ok: true };
  }

  emitChannelMessage(channelId: string, message: MessengerMessageDto): void {
    if (!this.server) return;
    this.server
      .to(messengerSocketChannelRoom(channelId))
      .emit(MESSENGER_WS_SERVER_CHANNEL_MESSAGE, {
        channelId,
        message,
      });
  }

  emitDmToParticipants(
    senderId: string,
    recipientId: string,
    threadId: string,
    message: MessengerMessageDto,
  ): void {
    if (!this.server) return;
    this.server.to(messengerSocketUserRoom(recipientId)).emit(MESSENGER_WS_SERVER_DM_MESSAGE, {
      threadId,
      counterpartId: senderId,
      message,
    });
    this.server.to(messengerSocketUserRoom(senderId)).emit(MESSENGER_WS_SERVER_DM_MESSAGE, {
      threadId,
      counterpartId: recipientId,
      message,
    });
  }

  /** Notifies all `/messenger` tabs for this employee to refresh list unread (after REST mark-read). */
  emitReadListsUpdated(employeeId: string): void {
    if (!this.server) return;
    this.server.to(messengerSocketUserRoom(employeeId)).emit(MESSENGER_WS_SERVER_READ_UPDATED, {
      scope: MESSENGER_WS_READ_UPDATED_SCOPE.LISTS,
    });
  }

  /** Notifies `peerEmployeeId` that `payload.counterpartId` advanced their DM read cursor. */
  emitDmPeerRead(peerEmployeeId: string, payload: MessengerWsDmPeerReadPayload): void {
    if (!this.server) return;
    this.server
      .to(messengerSocketUserRoom(peerEmployeeId))
      .emit(MESSENGER_WS_SERVER_DM_PEER_READ, payload);
  }

  emitChannelPeerRead(channelId: string, payload: MessengerWsChannelPeerReadPayload): void {
    if (!this.server) return;
    this.server
      .to(messengerSocketChannelRoom(channelId))
      .emit(MESSENGER_WS_SERVER_CHANNEL_PEER_READ, payload);
  }

  private async authenticateAndJoinUserRoom(client: Socket): Promise<void> {
    const token = readSocketToken(client);
    if (!token) {
      client.disconnect(true);
      return;
    }
    try {
      const payload = jwt.verify(token, this.jwtSecret) as JwtSubPayload;
      const employeeId = payload.sub;
      client.data.employeeId = employeeId;
      await client.join(messengerSocketUserRoom(employeeId));
      const { becameOnline } = this.presenceTracker.increment(employeeId);
      if (becameOnline) {
        this.server.emit(MESSENGER_WS_SERVER_PRESENCE, {
          employeeId,
          state: 'online' as const,
        });
      }
      client.emit(MESSENGER_WS_SERVER_PRESENCE_SNAPSHOT, {
        employeeIds: this.presenceTracker.snapshotEmployeeIds(),
      });
    } catch {
      this.logger.warn('Messenger socket auth failed');
      client.disconnect(true);
    }
  }

  private async typingDisplayLabel(employeeId: string): Promise<string> {
    const emp = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { firstName: true },
    });
    const n = emp?.firstName?.trim();
    return n && n.length > 0 ? n : 'Someone';
  }
}

function readSocketToken(client: Socket): string | null {
  const fromAuth = client.handshake.auth?.token;
  if (typeof fromAuth === 'string' && fromAuth.length > 0) return fromAuth;
  const header = client.handshake.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
}

function extractChannelId(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const raw = (body as { channelId?: unknown }).channelId;
  if (typeof raw !== 'string') return null;
  const id = raw.trim();
  return id.length > 0 ? id : null;
}

function extractRecipientId(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const raw = (body as { recipientId?: unknown }).recipientId;
  if (typeof raw !== 'string') return null;
  const id = raw.trim();
  return id.length > 0 ? id : null;
}
