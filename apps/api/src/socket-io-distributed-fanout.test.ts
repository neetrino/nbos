import { createServer, type Server as HttpServer } from 'node:http';
import { Adapter } from 'socket.io-adapter';
import { Server } from 'socket.io';
import { io as ioClient, type Socket } from 'socket.io-client';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * Proves a shared adapter delivers a room event across two Server objects.
 * This is not a live Redis roundtrip. Redis selection is covered separately.
 */
class FanoutBus {
  readonly members = new Set<SharedFanoutAdapter>();
}

class SharedFanoutAdapter extends Adapter {
  constructor(
    nsp: ConstructorParameters<typeof Adapter>[0],
    private readonly bus: FanoutBus,
  ) {
    super(nsp);
    bus.members.add(this);
  }

  override broadcast(
    packet: Parameters<Adapter['broadcast']>[0],
    opts: Parameters<Adapter['broadcast']>[1],
  ): void {
    for (const member of this.bus.members) {
      Adapter.prototype.broadcast.call(member, packet, opts);
    }
  }
}

describe('Socket.IO adapter broadcast across servers', () => {
  const closers: Array<() => Promise<void>> = [];

  afterEach(async () => {
    await Promise.all(closers.splice(0).map((close) => close()));
  });

  it('reaches a socket joined on server B when server A publishes to the room', async () => {
    const bus = new FanoutBus();
    const left = await listenServer(bus, closers);
    const right = await listenServer(bus, closers);
    const listener = await connectClient(right.port, closers);
    await joinRoom(listener, 'room-1');
    const received = waitForFanout(listener);
    left.server.to('room-1').emit('fanout', { n: 1 });
    await expect(received).resolves.toEqual({ n: 1 });
  });
});

function adapterFactory(bus: FanoutBus) {
  return function createSharedAdapter(nsp: ConstructorParameters<typeof Adapter>[0]) {
    return new SharedFanoutAdapter(nsp, bus);
  };
}

async function listenServer(bus: FanoutBus, closers: Array<() => Promise<void>>) {
  const httpServer = createServer();
  const server = new Server(httpServer);
  server.adapter(adapterFactory(bus));
  server.on('connection', (socket) => {
    socket.on('join', (room: string, ack?: () => void) => {
      void socket.join(room);
      ack?.();
    });
  });
  await listen(httpServer);
  const port = readPort(httpServer);
  closers.push(() => closeServer(server, httpServer));
  return { server, port };
}

function listen(httpServer: HttpServer): Promise<void> {
  return new Promise((resolve) => {
    httpServer.listen(0, '127.0.0.1', () => resolve());
  });
}

function readPort(httpServer: HttpServer): number {
  const address = httpServer.address();
  if (!address || typeof address === 'string') throw new Error('Socket.IO test server has no port');
  return address.port;
}

async function closeServer(server: Server, httpServer: HttpServer): Promise<void> {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  if (!httpServer.listening) return;
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
}

async function connectClient(port: number, closers: Array<() => Promise<void>>): Promise<Socket> {
  const socket = ioClient(`http://127.0.0.1:${port}`, { transports: ['websocket'] });
  closers.push(async () => {
    socket.close();
  });
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', () => resolve());
    socket.once('connect_error', (error: Error) => reject(error));
  });
  return socket;
}

function joinRoom(socket: Socket, room: string): Promise<void> {
  return new Promise((resolve) => {
    socket.emit('join', room, () => resolve());
  });
}

function waitForFanout(socket: Socket): Promise<{ n: number }> {
  return new Promise((resolve) => {
    socket.once('fanout', (payload: { n: number }) => resolve(payload));
  });
}
