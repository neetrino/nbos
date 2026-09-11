import type { QueryClient } from '@tanstack/react-query';
import { messengerClientApi } from '@/lib/api/messenger-core-client';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import type { MessengerDeltaPage } from '@/lib/api/messenger-core-delta';
import {
  clearMessengerHttpCheckpoint,
  readMessengerHttpCheckpoint,
  writeMessengerHttpCheckpoint,
  type MessengerHttpCheckpoint,
} from './messenger-checkpoint-store';
import { applyMessengerDeltaPages, type MessengerRecoverySession } from './messenger-delta-apply';
import { assertMessengerDeltaPage, rememberDeltaCursor } from './messenger-delta-page-guard';
import { ensureMessengerBootstrap } from './use-messenger-bootstrap';
import type { MessengerZone } from './messenger-query-keys';
import { messengerQueryKeys } from './messenger-query-keys';

const inflight = new WeakMap<QueryClient, Partial<Record<MessengerZone, Promise<void>>>>();

export function recoverMessengerZone(
  queryClient: QueryClient,
  zone: MessengerZone,
  session?: MessengerRecoverySession,
): Promise<void> {
  const current = inflight.get(queryClient) ?? {};
  const existing = current[zone];
  if (existing) return existing;
  const next = runZoneRecovery(queryClient, zone, session).finally(() => {
    const map = inflight.get(queryClient);
    if (!map) return;
    delete map[zone];
  });
  inflight.set(queryClient, { ...current, [zone]: next });
  return next;
}

async function runZoneRecovery(
  queryClient: QueryClient,
  zone: MessengerZone,
  session?: MessengerRecoverySession,
): Promise<void> {
  const stored = readMessengerHttpCheckpoint(queryClient, zone);
  if (!stored) {
    await fallbackMessengerRecovery(queryClient, zone, session);
    return;
  }
  try {
    const pages = await drainDeltaPages(zone, stored);
    applyMessengerDeltaPages(queryClient, zone, pages, session);
    const last = pages[pages.length - 1];
    if (!last) return;
    writeMessengerHttpCheckpoint(queryClient, zone, {
      checkpoint: last.checkpoint,
      authorizationEpoch: last.authorizationEpoch,
    });
  } catch {
    await fallbackMessengerRecovery(queryClient, zone, session);
  }
}

async function drainDeltaPages(
  zone: MessengerZone,
  stored: MessengerHttpCheckpoint,
): Promise<Array<MessengerDeltaPage<MessengerCoreConversationRow>>> {
  const pages: Array<MessengerDeltaPage<MessengerCoreConversationRow>> = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;
  do {
    rememberDeltaCursor(seenCursors, cursor);
    const page = await fetchDeltaPage(zone, stored, cursor);
    assertMessengerDeltaPage(zone, stored.checkpoint, page, pages[0]);
    pages.push(page);
    cursor = page.hasMore ? page.nextCursor : undefined;
  } while (cursor);
  return pages;
}

function fetchDeltaPage(
  zone: MessengerZone,
  stored: MessengerHttpCheckpoint,
  cursor: string | undefined,
): Promise<MessengerDeltaPage<MessengerCoreConversationRow>> {
  const params = {
    after: stored.checkpoint,
    cursor,
    authorizationEpoch: stored.authorizationEpoch,
  };
  if (zone === 'CLIENT') return messengerClientApi.listDelta(params);
  return messengerCoreApi.listDelta(params);
}

async function fallbackMessengerRecovery(
  queryClient: QueryClient,
  zone: MessengerZone,
  session?: MessengerRecoverySession,
): Promise<void> {
  clearMessengerHttpCheckpoint(queryClient, zone);
  await ensureMessengerBootstrap(queryClient, zone);
  if (!session?.activeId) return;
  void queryClient.invalidateQueries({
    queryKey: messengerQueryKeys.messages(session.activeId),
  });
}
