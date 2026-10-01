import { io, type Socket } from 'socket.io-client';
import { MESSENGER_SOCKET_NAMESPACE } from '@nbos/shared';

const MESSENGER_SOCKET_DEV_ORIGIN = 'http://localhost:4000';

export type MessengerClientSocket = {
  readonly connected: boolean;
  on(event: string, listener: (...args: unknown[]) => void): void;
  emit(event: string, ...args: unknown[]): void;
  close(): void;
  removeAllListeners(): void;
  io: {
    on(event: string, listener: (...args: unknown[]) => void): void;
  };
};

/**
 * The only Messenger `io(` call site in production web code.
 * One Socket.IO client per authenticated tab.
 */
export function connectMessengerSocket(token: string): MessengerClientSocket {
  const socket = io(`${messengerSocketOrigin()}${MESSENGER_SOCKET_NAMESPACE}`, {
    auth: { token },
    transports: ['websocket'],
  });
  return wrapMessengerSocket(socket);
}

function messengerSocketOrigin(): string {
  const origin = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  return origin && origin.length > 0 ? origin : MESSENGER_SOCKET_DEV_ORIGIN;
}

function bindManagerListener(
  socket: Socket,
  event: string,
  listener: (...args: unknown[]) => void,
): void {
  const managerOn = socket.io.on.bind(socket.io) as (
    eventName: string,
    handler: (...args: unknown[]) => void,
  ) => void;
  managerOn(event, listener);
}

function wrapMessengerSocket(socket: Socket): MessengerClientSocket {
  const emit = socket.emit.bind(socket) as (event: string, ...args: unknown[]) => void;
  return {
    get connected() {
      return socket.connected;
    },
    on(event, listener) {
      socket.on(event, listener as never);
    },
    emit,
    close() {
      socket.close();
    },
    removeAllListeners() {
      socket.removeAllListeners();
    },
    io: {
      on(event, listener) {
        bindManagerListener(socket, event, listener);
      },
    },
  };
}
