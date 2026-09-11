export const PERSIST_TEST_ISO = '2024-01-01T00:00:00.000Z';

export function persistTestInternalRow(id = 'c1') {
  return {
    id,
    zone: 'INTERNAL' as const,
    type: 'DIRECT' as const,
    title: 'Direct',
    status: 'ACTIVE',
    canonicalKey: null,
    createdAt: PERSIST_TEST_ISO,
    lastMessageAt: PERSIST_TEST_ISO,
    lastMessagePreview: 'hello',
    unreadCount: 0,
    peerEmployeeId: 'employee-user-bbbb',
    peerName: 'Peer User',
    isFavorite: false,
    canWrite: true,
  };
}

export function persistTestInternalPage(id = 'c1') {
  return {
    items: [persistTestInternalRow(id)],
    mentionsAvailable: true,
    hasMore: false,
  };
}

export function persistTestClientRow(id = 'c1') {
  return {
    id,
    zone: 'CLIENT' as const,
    type: 'EXTERNAL' as const,
    title: 'Lead',
    status: 'ACTIVE',
    canonicalKey: null,
    createdAt: PERSIST_TEST_ISO,
    lastMessageAt: PERSIST_TEST_ISO,
    lastMessagePreview: 'hello',
    lastMessageDirection: 'INBOUND' as const,
    unreadCount: 0,
    isFavorite: false,
    canSend: true,
    provider: 'WHATSAPP' as const,
    leadId: null,
    attention: [] as const,
  };
}

export function persistTestClientPage(id = 'c1') {
  return { items: [persistTestClientRow(id)], hasMore: false };
}

export function persistTestCollection(id = 'col-1', name = 'Favorites') {
  return {
    id,
    name,
    visibility: 'PERSONAL' as const,
    zone: 'INTERNAL' as const,
    ownerEmployeeId: 'employee-user-aaaa',
  };
}
