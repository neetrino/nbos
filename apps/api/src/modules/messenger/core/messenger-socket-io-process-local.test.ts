import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Phase 6 Socket.IO process-local limitation', () => {
  it('API adapter is CORS-only and does not install a Redis Socket.IO adapter', () => {
    const adapter = readFileSync(new URL('../../../socket-io.adapter.ts', import.meta.url), 'utf8');
    const main = readFileSync(new URL('../../../main.ts', import.meta.url), 'utf8');
    expect(adapter).toMatch(/class SocketIoCorsAdapter extends IoAdapter/);
    expect(adapter).not.toMatch(/createAdapter|@socket.io\/redis-adapter|socket.io-redis/);
    expect(main).toMatch(/useWebSocketAdapter\(new SocketIoCorsAdapter/);
    expect(main).not.toMatch(/createAdapter|@socket.io\/redis-adapter/);
  });
});
