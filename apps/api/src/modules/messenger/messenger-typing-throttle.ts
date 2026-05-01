import { MESSENGER_TYPING_EMIT_MIN_MS } from '@nbos/shared';

export class MessengerTypingThrottle {
  private readonly lastBySocketId = new Map<string, number>();

  allow(socketId: string, now: number = Date.now()): boolean {
    const last = this.lastBySocketId.get(socketId) ?? 0;
    if (now - last < MESSENGER_TYPING_EMIT_MIN_MS) return false;
    this.lastBySocketId.set(socketId, now);
    return true;
  }
}
