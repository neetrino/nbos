import type { QueryClient } from '@tanstack/react-query';
import { MESSENGER_READ_WATERMARK_MAX_PER_ZONE } from './messenger-query-policy';
import type { MessengerZone } from './messenger-query-keys';

type ZoneWatermarkMaps = Record<MessengerZone, Map<string, string>>;

const watermarkStores = new WeakMap<QueryClient, ZoneWatermarkMaps>();

export function compareIsoInstants(left: string, right: string): number {
  return Date.parse(left) - Date.parse(right);
}

export function getReadWatermark(
  queryClient: QueryClient,
  zone: MessengerZone,
  conversationId: string,
): string | null {
  return zoneWatermarks(queryClient, zone).get(conversationId) ?? null;
}

/**
 * Newest absolute read cursor for this QueryClient session.
 * Not query-cache data; survives unused-query gcTime. Phase 4 owns durable replay.
 */
export function advanceReadWatermark(
  queryClient: QueryClient,
  zone: MessengerZone,
  conversationId: string,
  lastReadAt: string | null,
): boolean {
  if (!lastReadAt) return false;
  const store = zoneWatermarks(queryClient, zone);
  const current = store.get(conversationId);
  if (current && compareIsoInstants(lastReadAt, current) < 0) return false;
  if (current === lastReadAt) return true;
  writeWatermark(store, conversationId, lastReadAt);
  return true;
}

export function clearReadWatermark(
  queryClient: QueryClient,
  zone: MessengerZone,
  conversationId: string,
): void {
  zoneWatermarks(queryClient, zone).delete(conversationId);
}

function writeWatermark(
  store: Map<string, string>,
  conversationId: string,
  lastReadAt: string,
): void {
  if (store.has(conversationId)) {
    store.delete(conversationId);
  } else if (store.size >= MESSENGER_READ_WATERMARK_MAX_PER_ZONE) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
  store.set(conversationId, lastReadAt);
}

function zoneWatermarks(queryClient: QueryClient, zone: MessengerZone): Map<string, string> {
  const existing = watermarkStores.get(queryClient);
  if (existing) return existing[zone];
  const created: ZoneWatermarkMaps = {
    INTERNAL: new Map(),
    CLIENT: new Map(),
  };
  watermarkStores.set(queryClient, created);
  return created[zone];
}
