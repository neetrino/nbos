import { IoAdapter } from '@nestjs/platform-socket.io';
import type { INestApplication } from '@nestjs/common';
import type { ServerOptions } from 'socket.io';

const DEFAULT_SOCKET_CORS_ORIGINS = ['http://localhost:3000'];

function socketCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN;
  if (!raw?.trim()) return DEFAULT_SOCKET_CORS_ORIGINS;
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

/** Applies the same browser origins as HTTP CORS for Socket.IO handshakes. */
export class SocketIoCorsAdapter extends IoAdapter {
  constructor(app: INestApplication) {
    super(app);
  }

  override createIOServer(port: number, options?: ServerOptions) {
    const merged = {
      ...options,
      cors: {
        origin: socketCorsOrigins(),
        credentials: true,
      },
    } as ServerOptions;
    return super.createIOServer(port, merged);
  }
}
