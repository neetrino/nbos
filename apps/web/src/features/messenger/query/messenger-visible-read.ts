import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';

/** One read request for a burst. Not one request per message. */
export const MESSENGER_VISIBLE_READ_COALESCE_MS = 300;

export type VisibleReadGate = {
  conversationId: string | null;
  threadMounted: boolean;
  documentVisible: boolean;
};

export function isVisibleOpenThread(gate: VisibleReadGate): boolean {
  return Boolean(gate.conversationId) && gate.threadMounted && gate.documentVisible;
}

export function latestCanonicalMessageId(
  items: readonly MessengerCoreMessageRow[] | undefined,
): string | null {
  let latest: MessengerCoreMessageRow | null = null;
  for (const row of items ?? []) {
    if (row.localSend || row.deletedAt) continue;
    if (!latest || row.createdAt > latest.createdAt) latest = row;
  }
  return latest?.id ?? null;
}

/**
 * Schedules at most one in-flight read for the open visible thread.
 * Hiding the document cancels a read that has not been sent.
 */
export class MessengerVisibleReadCoalescer {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private inFlight = false;
  private dirty = false;
  private conversationId: string | null = null;
  private send: (conversationId: string) => void | Promise<void>;

  constructor(
    private readonly delayMs: number,
    send: (conversationId: string) => void | Promise<void>,
  ) {
    this.send = send;
  }

  /** Latest read callback. Updated from an effect, not during render. */
  setSend(send: (conversationId: string) => void | Promise<void>): void {
    this.send = send;
  }

  note(gate: VisibleReadGate): void {
    if (!isVisibleOpenThread(gate)) {
      this.holdClosed();
      return;
    }
    this.conversationId = gate.conversationId;
    this.dirty = true;
    this.arm();
  }

  dispose(): void {
    this.holdClosed();
    this.conversationId = null;
  }

  private holdClosed(): void {
    this.dirty = false;
    this.clearTimer();
  }

  private arm(): void {
    if (this.timer || this.inFlight || !this.dirty || !this.conversationId) return;
    this.timer = setTimeout(() => this.flush(), this.delayMs);
  }

  private clearTimer(): void {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.timer = null;
  }

  private flush(): void {
    this.timer = null;
    const id = this.conversationId;
    if (!id || !this.dirty) return;
    this.dirty = false;
    this.inFlight = true;
    void Promise.resolve(this.send(id)).finally(() => {
      this.inFlight = false;
      this.arm();
    });
  }
}
