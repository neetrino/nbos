export type MessengerSubscriptionSubscribe = {
  conversationId: string;
  generation: number;
};

export type MessengerSubscriptionLeave = {
  conversationId: string;
};

type SubscriptionEntry = {
  refcount: number;
  generation: number;
  pendingGeneration: number | null;
  joined: boolean;
  orphanLeaveSent: boolean;
  /** Pre-authorization `{ ok: false }`. Not a permanent denial. */
  authHold: boolean;
};

/**
 * Reference-counted conversation rooms for one tab.
 * The registry never talks to Socket.IO. Callers emit subscribe and leave.
 */
export class MessengerSubscriptionRegistry {
  private readonly entries = new Map<string, SubscriptionEntry>();

  acquire(conversationId: string): MessengerSubscriptionSubscribe | null {
    const id = normalizeConversationId(conversationId);
    if (!id) return null;
    const entry = this.ensure(id);
    entry.refcount += 1;
    if (entry.refcount > 1) return null;
    return this.beginSubscribe(entry, id);
  }

  release(conversationId: string): MessengerSubscriptionLeave | null {
    const entry = this.entries.get(normalizeConversationId(conversationId));
    if (!entry || entry.refcount === 0) return null;
    entry.refcount -= 1;
    if (entry.refcount > 0 || !entry.joined) return null;
    entry.joined = false;
    entry.pendingGeneration = null;
    entry.orphanLeaveSent = true;
    return { conversationId: normalizeConversationId(conversationId) };
  }

  /**
   * Remembers a subscribe failure that happened before this socket was authorized.
   * A later success for the same generation can still join while the refcount is positive.
   */
  holdForAuthorization(conversationId: string, generation: number): void {
    const entry = this.entries.get(normalizeConversationId(conversationId));
    if (!entry || entry.pendingGeneration !== generation) return;
    entry.pendingGeneration = null;
    entry.joined = false;
    entry.authHold = true;
  }

  /** Subscribe again for retained conversations blocked only by missing authorization. */
  retryHeld(): MessengerSubscriptionSubscribe[] {
    const intents: MessengerSubscriptionSubscribe[] = [];
    for (const [conversationId, entry] of this.entries) {
      if (!entry.authHold) continue;
      entry.authHold = false;
      if (entry.refcount === 0 || entry.joined) continue;
      intents.push(this.beginSubscribe(entry, conversationId));
    }
    return intents;
  }

  acknowledge(
    conversationId: string,
    generation: number,
    ok: boolean,
  ): MessengerSubscriptionLeave | null {
    const id = normalizeConversationId(conversationId);
    const entry = this.entries.get(id);
    if (!entry || !matchesAck(entry, generation)) {
      return this.leaveIfUnwanted(entry, id, ok);
    }
    return this.applyAck(entry, id, ok);
  }

  /** Subscribe intents for every conversation whose refcount is still positive. */
  resubscribeAll(): MessengerSubscriptionSubscribe[] {
    const intents: MessengerSubscriptionSubscribe[] = [];
    for (const [conversationId, entry] of this.entries) {
      entry.joined = false;
      entry.pendingGeneration = null;
      entry.orphanLeaveSent = false;
      entry.authHold = false;
      if (entry.refcount === 0) continue;
      intents.push(this.beginSubscribe(entry, conversationId));
    }
    return intents;
  }

  refcount(conversationId: string): number {
    return this.entries.get(normalizeConversationId(conversationId))?.refcount ?? 0;
  }

  isJoined(conversationId: string): boolean {
    return this.entries.get(normalizeConversationId(conversationId))?.joined ?? false;
  }

  private beginSubscribe(
    entry: SubscriptionEntry,
    conversationId: string,
  ): MessengerSubscriptionSubscribe {
    entry.generation += 1;
    entry.pendingGeneration = entry.generation;
    entry.joined = false;
    entry.orphanLeaveSent = false;
    entry.authHold = false;
    return { conversationId, generation: entry.generation };
  }

  private applyAck(
    entry: SubscriptionEntry,
    conversationId: string,
    ok: boolean,
  ): MessengerSubscriptionLeave | null {
    entry.pendingGeneration = null;
    entry.authHold = false;
    if (ok && entry.refcount > 0) {
      entry.joined = true;
      return null;
    }
    entry.joined = false;
    return this.leaveIfUnwanted(entry, conversationId, ok);
  }

  private leaveIfUnwanted(
    entry: SubscriptionEntry | undefined,
    conversationId: string,
    ok: boolean,
  ): MessengerSubscriptionLeave | null {
    if (!ok || !conversationId) return null;
    if (entry && (entry.refcount > 0 || entry.orphanLeaveSent)) return null;
    if (entry) {
      entry.joined = false;
      entry.pendingGeneration = null;
      entry.orphanLeaveSent = true;
    }
    return { conversationId };
  }

  private ensure(conversationId: string): SubscriptionEntry {
    const existing = this.entries.get(conversationId);
    if (existing) return existing;
    const created: SubscriptionEntry = {
      refcount: 0,
      generation: 0,
      pendingGeneration: null,
      joined: false,
      orphanLeaveSent: false,
      authHold: false,
    };
    this.entries.set(conversationId, created);
    return created;
  }
}

function matchesAck(entry: SubscriptionEntry, generation: number): boolean {
  if (entry.pendingGeneration === generation) return true;
  return entry.authHold && entry.generation === generation;
}

function normalizeConversationId(conversationId: string): string {
  return conversationId.trim();
}
