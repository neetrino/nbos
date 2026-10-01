import type { QueryClient } from '@tanstack/react-query';
import {
  MESSENGER_WS_CLIENT_LEAVE_CONVERSATION,
  MESSENGER_WS_CLIENT_SUBSCRIBE_CHANNEL,
  MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION,
  MESSENGER_WS_CLIENT_TYPING_CHANNEL,
  MESSENGER_WS_CLIENT_TYPING_CONVERSATION,
  MESSENGER_WS_CLIENT_TYPING_DM,
} from '@nbos/shared';
import type { RealtimeSessionResult } from '@/lib/auth/realtime-session';
import type { MessengerZone } from '../query/messenger-query-keys';
import type { MessengerRecoverySession } from '../query/messenger-realtime-cache';
import { applyPresenceIds } from './messenger-legacy-parse';
import type { MessengerLegacyFanout, MessengerLegacyListener } from './messenger-legacy-socket';
import { applyMessengerCoreSocketEvent } from './messenger-realtime-cache-bind';
import { noteMessengerSocketReady } from '../query/messenger-outbox-replay';
import { isMessengerSubscribeAckOk } from './messenger-subscribe-ack';
import { MessengerSocketSession, type MessengerConnectionState } from './messenger-socket-session';
import type { MessengerClientSocket } from './messenger-socket-client';
import {
  MessengerSubscriptionRegistry,
  type MessengerSubscriptionSubscribe,
} from './messenger-subscription-registry';

export type { MessengerConnectionState };

export type MessengerSurfaceBinding = {
  zone: MessengerZone;
  getActiveId: () => string | null;
  clearActive: () => void;
};

export type MessengerRealtimeHubOptions = {
  connect: (token: string) => MessengerClientSocket;
  recoverSession: () => Promise<RealtimeSessionResult>;
  recoverZone: (
    queryClient: QueryClient,
    zone: MessengerZone,
    session?: MessengerRecoverySession,
  ) => Promise<void>;
};

/**
 * One Messenger socket for the tab. Components retain and release conversation
 * ids. They do not call `io()`.
 */
export class MessengerRealtimeHub {
  readonly getState: () => MessengerConnectionState;
  readonly subscribeState: (listener: (state: MessengerConnectionState) => void) => () => void;

  private queryClient: QueryClient | null = null;
  private legacyChannelId: string | null = null;
  private presenceIds: readonly string[] = [];
  /** True after this connection's post-auth presence snapshot. */
  private socketAuthorized = false;
  private readonly registry = new MessengerSubscriptionRegistry();
  private readonly surfaces = new Set<MessengerSurfaceBinding>();
  private readonly legacy = new Set<MessengerLegacyListener>();
  private readonly legacyFanout: MessengerLegacyFanout;
  private readonly session: MessengerSocketSession;

  constructor(options: MessengerRealtimeHubOptions) {
    this.legacyFanout = createLegacyFanout(this);
    this.session = new MessengerSocketSession(options.connect, options.recoverSession, () => ({
      onConnected: (reconnected) => this.onConnected(reconnected, options),
      onCoreEvent: (event, payload) => this.onCoreEvent(event, payload),
      legacyFanout: this.legacyFanout,
    }));
    this.getState = this.session.getState;
    this.subscribeState = this.session.subscribeState;
  }

  attachQueryClient(queryClient: QueryClient): void {
    this.queryClient = queryClient;
  }

  start(token: string): void {
    this.session.start(token);
  }

  stop(): void {
    this.session.stop();
  }

  retainConversation(conversationId: string): () => void {
    const intent = this.registry.acquire(conversationId);
    if (intent) this.emitSubscribe(intent);
    return createRelease(this, conversationId);
  }

  registerSurface(binding: MessengerSurfaceBinding): () => void {
    this.surfaces.add(binding);
    return () => this.surfaces.delete(binding);
  }

  addLegacyListener(listener: MessengerLegacyListener): () => void {
    this.legacy.add(listener);
    if (this.presenceIds.length > 0) listener.onPresenceSnapshot?.(this.presenceIds);
    return () => this.legacy.delete(listener);
  }

  setLegacyChannel(channelId: string | null): void {
    this.legacyChannelId = channelId;
    if (!channelId) return;
    this.session.emit(MESSENGER_WS_CLIENT_SUBSCRIBE_CHANNEL, { channelId });
  }

  emitConversationTyping(conversationId: string): void {
    this.session.emit(MESSENGER_WS_CLIENT_TYPING_CONVERSATION, { conversationId });
  }

  emitChannelTyping(channelId: string): void {
    this.session.emit(MESSENGER_WS_CLIENT_TYPING_CHANNEL, { channelId });
  }

  emitDmTyping(recipientId: string): void {
    this.session.emit(MESSENGER_WS_CLIENT_TYPING_DM, { recipientId });
  }

  releaseConversation(conversationId: string): void {
    const leave = this.registry.release(conversationId);
    if (leave) this.emitLeave(leave.conversationId);
  }

  private onConnected(reconnected: boolean, options: MessengerRealtimeHubOptions): void {
    this.socketAuthorized = false;
    this.restoreSubscriptions();
    this.restoreLegacyChannel();
    if (reconnected) this.recoverAfterReconnect(options);
    if (this.queryClient) noteMessengerSocketReady(this.queryClient);
  }

  private restoreSubscriptions(): void {
    for (const intent of this.registry.resubscribeAll()) this.emitSubscribe(intent);
  }

  private restoreLegacyChannel(): void {
    if (!this.legacyChannelId) return;
    this.session.emit(MESSENGER_WS_CLIENT_SUBSCRIBE_CHANNEL, { channelId: this.legacyChannelId });
  }

  private recoverAfterReconnect(options: MessengerRealtimeHubOptions): void {
    const queryClient = this.queryClient;
    if (!queryClient) return;
    void options.recoverZone(queryClient, 'INTERNAL', this.recoverySession('INTERNAL'));
    void options.recoverZone(queryClient, 'CLIENT', this.recoverySession('CLIENT'));
  }

  private recoverySession(zone: MessengerZone): MessengerRecoverySession {
    const openConversationIds = openSurfaceIds(this.surfaces, zone);
    const activeId = openConversationIds[0] ?? null;
    return {
      activeId,
      clearActive: () => {
        if (activeId) this.clearSurfaces(zone, activeId);
      },
      openConversationIds,
      onRemoved: (conversationId) => this.clearSurfaces(zone, conversationId),
    };
  }

  private onCoreEvent(event: string, payload: unknown): void {
    const queryClient = this.queryClient;
    if (!queryClient) return;
    const access = applyMessengerCoreSocketEvent(queryClient, event, payload);
    if (!access) return;
    this.clearSurfaces(access.zone, access.conversationId);
  }

  private clearSurfaces(zone: MessengerZone, conversationId: string): void {
    for (const surface of this.surfaces) {
      if (surface.zone !== zone || surface.getActiveId() !== conversationId) continue;
      surface.clearActive();
    }
  }

  private emitSubscribe(intent: MessengerSubscriptionSubscribe): void {
    this.session.emitWithAck(
      MESSENGER_WS_CLIENT_SUBSCRIBE_CONVERSATION,
      { conversationId: intent.conversationId },
      (response) => this.onSubscribeAck(intent, response),
    );
  }

  /** Presence snapshot is emitted only after the server stores `employeeId`. */
  noteSocketAuthorized(): void {
    if (this.socketAuthorized) return;
    this.socketAuthorized = true;
    for (const intent of this.registry.retryHeld()) this.emitSubscribe(intent);
  }

  private onSubscribeAck(intent: MessengerSubscriptionSubscribe, response: unknown): void {
    if (this.holdUnauthorized(intent, response)) return;
    const leave = this.registry.acknowledge(
      intent.conversationId,
      intent.generation,
      isMessengerSubscribeAckOk(response),
    );
    if (leave) this.emitLeave(leave.conversationId);
  }

  private holdUnauthorized(intent: MessengerSubscriptionSubscribe, response: unknown): boolean {
    if (this.socketAuthorized || isMessengerSubscribeAckOk(response)) return false;
    this.registry.holdForAuthorization(intent.conversationId, intent.generation);
    return true;
  }

  private emitLeave(conversationId: string): void {
    this.session.emit(MESSENGER_WS_CLIENT_LEAVE_CONVERSATION, { conversationId });
  }

  replacePresence(employeeIds: readonly string[]): void {
    this.presenceIds = employeeIds;
    this.fanout((listener) => listener.onPresenceSnapshot?.(employeeIds));
  }

  shiftPresence(employeeId: string, state: 'online' | 'offline'): void {
    this.presenceIds = applyPresenceIds(this.presenceIds, employeeId, state);
    this.fanout((listener) => listener.onPresenceDelta?.(employeeId, state));
  }

  fanout(send: (listener: MessengerLegacyListener) => void): void {
    for (const listener of this.legacy) send(listener);
  }
}

function createRelease(hub: MessengerRealtimeHub, conversationId: string): () => void {
  let released = false;
  return () => {
    if (released) return;
    released = true;
    hub.releaseConversation(conversationId);
  };
}

function openSurfaceIds(
  surfaces: ReadonlySet<MessengerSurfaceBinding>,
  zone: MessengerZone,
): string[] {
  const ids = new Set<string>();
  for (const surface of surfaces) {
    if (surface.zone !== zone) continue;
    const id = surface.getActiveId();
    if (id) ids.add(id);
  }
  return [...ids];
}

function createLegacyFanout(hub: MessengerRealtimeHub): MessengerLegacyFanout {
  return {
    onChannelMessage: (channelId, message) =>
      hub.fanout((listener) => listener.onChannelMessage?.(channelId, message)),
    onDmMessage: (counterpartId, message) =>
      hub.fanout((listener) => listener.onDmMessage?.(counterpartId, message)),
    onChannelTyping: (payload) => hub.fanout((listener) => listener.onChannelTyping?.(payload)),
    onDmTyping: (payload) => hub.fanout((listener) => listener.onDmTyping?.(payload)),
    onPresenceSnapshot: (employeeIds) => {
      hub.replacePresence(employeeIds);
      hub.noteSocketAuthorized();
    },
    onPresenceDelta: (employeeId, state) => hub.shiftPresence(employeeId, state),
    onReadLists: () => hub.fanout((listener) => listener.onReadLists?.()),
    onDmPeerRead: (payload) => hub.fanout((listener) => listener.onDmPeerRead?.(payload)),
    onChannelPeerRead: (payload) => hub.fanout((listener) => listener.onChannelPeerRead?.(payload)),
  };
}
