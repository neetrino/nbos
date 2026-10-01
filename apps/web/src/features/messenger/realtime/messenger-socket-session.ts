import {
  MESSENGER_WS_SERVER_CONVERSATION_ACCESS_CHANGED,
  MESSENGER_WS_SERVER_CONVERSATION_FAVORITE,
  MESSENGER_WS_SERVER_CONVERSATION_MESSAGE,
  MESSENGER_WS_SERVER_CONVERSATION_PEER_READ,
  MESSENGER_WS_SERVER_CONVERSATION_SUMMARY,
  MESSENGER_WS_SERVER_READ_UPDATED,
} from '@nbos/shared';
import type { RealtimeSessionResult } from '@/lib/auth/realtime-session';
import { bindMessengerLegacySocket, type MessengerLegacyFanout } from './messenger-legacy-socket';
import type { MessengerClientSocket } from './messenger-socket-client';

export type MessengerConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected';

export type MessengerSocketSessionHooks = {
  onConnected: (reconnected: boolean) => void;
  onCoreEvent: (event: string, payload: unknown) => void;
  legacyFanout: MessengerLegacyFanout;
};

const CLIENT_DISCONNECT = 'io client disconnect';
const SERVER_DISCONNECT = 'io server disconnect';
const CORE_SOCKET_EVENTS = [
  MESSENGER_WS_SERVER_CONVERSATION_MESSAGE,
  MESSENGER_WS_SERVER_CONVERSATION_SUMMARY,
  MESSENGER_WS_SERVER_READ_UPDATED,
  MESSENGER_WS_SERVER_CONVERSATION_ACCESS_CHANGED,
  MESSENGER_WS_SERVER_CONVERSATION_FAVORITE,
  MESSENGER_WS_SERVER_CONVERSATION_PEER_READ,
] as const;

export class MessengerSocketSession {
  readonly getState = (): MessengerConnectionState => this.state;
  readonly subscribeState = (listener: (state: MessengerConnectionState) => void): (() => void) => {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  };

  private state: MessengerConnectionState = 'idle';
  private token: string | null = null;
  private socket: MessengerClientSocket | null = null;
  private connectedOnce = false;
  private readonly stateListeners = new Set<(state: MessengerConnectionState) => void>();

  constructor(
    private readonly connectSocket: (token: string) => MessengerClientSocket,
    private readonly recoverSession: () => Promise<RealtimeSessionResult>,
    private readonly hooks: () => MessengerSocketSessionHooks,
  ) {}

  start(token: string): void {
    if (this.token === token && this.socket) return;
    this.token = token;
    this.closeSocket();
    this.setState('connecting');
    const socket = this.connectSocket(token);
    this.socket = socket;
    this.bindSocket(socket);
  }

  stop(): void {
    this.token = null;
    this.closeSocket();
    this.setState('idle');
  }

  emit(event: string, ...args: unknown[]): void {
    if (!this.socket?.connected) return;
    this.socket.emit(event, ...args);
  }

  emitWithAck(event: string, payload: unknown, onAck: (response: unknown) => void): void {
    const socket = this.socket;
    if (!socket?.connected) return;
    socket.emit(event, payload, (response: unknown) => {
      if (this.socket !== socket) return;
      onAck(response);
    });
  }

  private bindSocket(socket: MessengerClientSocket): void {
    socket.on('connect', () => {
      if (this.socket !== socket) return;
      this.handleConnect();
    });
    socket.on('disconnect', (reason: unknown) => {
      if (this.socket !== socket) return;
      this.handleDisconnect(reason);
    });
    socket.on('connect_error', () => {
      if (this.socket !== socket) return;
      this.handleConnectError(socket);
    });
    this.bindManager(socket);
    this.bindCoreEvents(socket);
    bindMessengerLegacySocket(socket, this.hooks().legacyFanout);
  }

  private bindManager(socket: MessengerClientSocket): void {
    socket.io.on('reconnect_attempt', () => {
      if (this.socket !== socket) return;
      this.setState('reconnecting');
    });
    socket.io.on('reconnect_failed', () => {
      if (this.socket !== socket) return;
      this.setState('disconnected');
    });
  }

  private bindCoreEvents(socket: MessengerClientSocket): void {
    for (const event of CORE_SOCKET_EVENTS) {
      socket.on(event, (payload: unknown) => {
        if (this.socket !== socket) return;
        this.hooks().onCoreEvent(event, payload);
      });
    }
  }

  private handleConnect(): void {
    const reconnected = this.connectedOnce;
    this.connectedOnce = true;
    this.setState('connected');
    this.hooks().onConnected(reconnected);
  }

  private handleDisconnect(reason: unknown): void {
    if (reason === CLIENT_DISCONNECT) {
      this.setState('idle');
      return;
    }
    this.setState(reason === SERVER_DISCONNECT ? 'disconnected' : 'reconnecting');
  }

  private handleConnectError(socket: MessengerClientSocket): void {
    this.setState(this.connectedOnce ? 'reconnecting' : 'connecting');
    const token = this.token;
    void this.recoverSession().then((result) => {
      this.applyRecoveredSession(socket, token, result);
    });
  }

  private applyRecoveredSession(
    socket: MessengerClientSocket,
    token: string | null,
    result: RealtimeSessionResult,
  ): void {
    if (this.socket !== socket) return;
    if (result.kind === 'session-invalid') {
      this.stop();
      return;
    }
    if (result.kind === 'available' && result.accessToken !== token) {
      this.start(result.accessToken);
    }
  }

  private closeSocket(): void {
    const socket = this.socket;
    this.socket = null;
    if (!socket) return;
    socket.removeAllListeners();
    socket.close();
  }

  private setState(next: MessengerConnectionState): void {
    if (this.state === next) return;
    this.state = next;
    for (const listener of this.stateListeners) listener(next);
  }
}
