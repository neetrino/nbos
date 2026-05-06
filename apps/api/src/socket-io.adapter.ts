import { IoAdapter } from '@nestjs/platform-socket.io';
import type { INestApplication } from '@nestjs/common';
import type { ServerOptions } from 'socket.io';
import { parseCorsOriginsFromEnv } from './security/cors-origins';

/** Applies the same browser origins as HTTP CORS for Socket.IO handshakes. */
export class SocketIoCorsAdapter extends IoAdapter {
  constructor(app: INestApplication) {
    super(app);
  }

  override createIOServer(port: number, options?: ServerOptions) {
    const merged = {
      ...options,
      cors: {
        origin: parseCorsOriginsFromEnv(),
        credentials: true,
      },
    } as ServerOptions;
    return super.createIOServer(port, merged);
  }
}
