import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import {
  collectCachedDirectUnreadByPeerId,
  collectCachedPinnedDirectPeerIds,
} from './find-cached-direct-conversation';

function row(
  overrides: Partial<MessengerCoreConversationRow> & Pick<MessengerCoreConversationRow, 'id'>,
): MessengerCoreConversationRow {
  return {
    zone: 'INTERNAL',
    type: 'DIRECT',
    title: null,
    status: 'OPEN',
    canonicalKey: null,
    createdAt: '2026-09-30T10:00:00.000Z',
    lastMessageAt: '2026-09-30T10:00:00.000Z',
    unreadCount: 0,
    peerEmployeeId: 'peer-1',
    peerName: 'Peer One',
    isFavorite: false,
    canWrite: true,
    ...overrides,
  };
}

describe('collectCachedDirectUnreadByPeerId', () => {
  it('reads unread DIRECT peers from summary cache', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' }), {
      items: [
        row({ id: 'd1', peerEmployeeId: 'peer-1', unreadCount: 3 }),
        row({ id: 'g1', type: 'INTERNAL_GROUP', peerEmployeeId: null, unreadCount: 9 }),
        row({ id: 'd2', peerEmployeeId: 'peer-2', unreadCount: 0 }),
      ],
      mentionsAvailable: false,
    });

    const unread = collectCachedDirectUnreadByPeerId(queryClient);
    expect(unread.get('peer-1')).toBe(3);
    expect(unread.has('peer-2')).toBe(false);
  });

  it('keeps the max unread across cached list copies', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' }), {
      items: [row({ id: 'd1', peerEmployeeId: 'peer-1', unreadCount: 1 })],
      mentionsAvailable: false,
    });
    queryClient.setQueryData(
      messengerQueryKeys.internalSummaries({
        source: 'section',
        section: 'direct',
        q: '',
        filter: 'all',
      }),
      {
        items: [row({ id: 'd1', peerEmployeeId: 'peer-1', unreadCount: 4 })],
        mentionsAvailable: false,
      },
    );

    expect(collectCachedDirectUnreadByPeerId(queryClient).get('peer-1')).toBe(4);
  });
});

describe('collectCachedPinnedDirectPeerIds', () => {
  it('collects favorite DIRECT peers', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' }), {
      items: [
        row({ id: 'd1', peerEmployeeId: 'peer-1', isFavorite: true }),
        row({ id: 'd2', peerEmployeeId: 'peer-2', isFavorite: false }),
      ],
      mentionsAvailable: false,
    });

    expect([...collectCachedPinnedDirectPeerIds(queryClient)]).toEqual(['peer-1']);
  });
});
