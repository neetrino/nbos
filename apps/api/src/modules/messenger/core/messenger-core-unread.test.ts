import { describe, expect, it } from 'vitest';
import { mapInternalListItem, type InternalListRow } from './messenger-core-internal-list-map';
import { absoluteRecipientUnreadCount } from './messenger-core-summary-recipients.ops';
import { absoluteConversationUnreadCount } from './messenger-core-unread';

const LAST_AT = new Date('2026-09-05T12:00:00.000Z');
const BEHIND = new Date('2020-01-01T00:00:00.000Z');

describe('absoluteConversationUnreadCount', () => {
  it('matches fanout unread for own send, peer send, and inbound null sender', () => {
    const own = {
      viewerEmployeeId: 'e1',
      latestSenderId: 'e1',
      lastMessageAt: LAST_AT,
      lastReadAt: BEHIND,
    };
    const inbound = { ...own, latestSenderId: null };
    const peer = { ...own, latestSenderId: 'e2' };
    expect(absoluteConversationUnreadCount(own)).toBe(0);
    expect(absoluteConversationUnreadCount(inbound)).toBe(1);
    expect(absoluteConversationUnreadCount(peer)).toBe(1);
    expect(
      absoluteRecipientUnreadCount({
        employeeId: own.viewerEmployeeId,
        senderId: own.latestSenderId,
        lastMessageAt: own.lastMessageAt,
        lastReadAt: own.lastReadAt,
      }),
    ).toBe(0);
    expect(
      absoluteRecipientUnreadCount({
        employeeId: inbound.viewerEmployeeId,
        senderId: inbound.latestSenderId,
        lastMessageAt: inbound.lastMessageAt,
        lastReadAt: inbound.lastReadAt,
      }),
    ).toBe(1);
  });

  it('uses latest visible createdAt, ignoring later hidden or deleted denormalized time', () => {
    const visibleAt = new Date('2026-09-05T10:00:00.000Z');
    const hiddenAt = new Date('2026-09-05T12:00:00.000Z');
    const readAt = new Date('2026-09-05T10:00:00.000Z');
    const hiddenLater = mapListRow({
      lastMessageAt: hiddenAt,
      messages: [{ content: 'visible', senderId: 'e2', createdAt: visibleAt }],
      readStates: [{ employeeId: 'e1', lastReadAt: readAt }],
    });
    const visibleLater = mapListRow({
      lastMessageAt: hiddenAt,
      messages: [{ content: 'new', senderId: 'e2', createdAt: hiddenAt }],
      readStates: [{ employeeId: 'e1', lastReadAt: readAt }],
    });
    const ownSend = mapListRow({
      lastMessageAt: hiddenAt,
      messages: [{ content: 'mine', senderId: 'e1', createdAt: hiddenAt }],
      readStates: [{ employeeId: 'e1', lastReadAt: new Date('2020-01-01T00:00:00.000Z') }],
    });
    expect(hiddenLater.unreadCount).toBe(0);
    expect(visibleLater.unreadCount).toBe(1);
    expect(ownSend.unreadCount).toBe(0);
    expect(ownSend.lastMessageMine).toBe(true);
    expect(ownSend.lastMessageSeen).toBe(false);
  });

  it('marks own latest message seen when a peer read cursor covers it', () => {
    const sentAt = new Date('2026-09-05T12:00:00.000Z');
    const unseen = mapListRow({
      messages: [{ content: 'mine', senderId: 'e1', createdAt: sentAt }],
      readStates: [{ employeeId: 'e1', lastReadAt: sentAt }],
    });
    const seen = mapListRow({
      messages: [{ content: 'mine', senderId: 'e1', createdAt: sentAt }],
      readStates: [
        { employeeId: 'e1', lastReadAt: sentAt },
        { employeeId: 'e2', lastReadAt: sentAt },
      ],
    });
    const peerSend = mapListRow({
      messages: [{ content: 'theirs', senderId: 'e2', createdAt: sentAt }],
      readStates: [
        { employeeId: 'e1', lastReadAt: sentAt },
        { employeeId: 'e2', lastReadAt: sentAt },
      ],
    });
    expect(unseen.lastMessageMine).toBe(true);
    expect(unseen.lastMessageSeen).toBe(false);
    expect(seen.lastMessageSeen).toBe(true);
    expect(peerSend.lastMessageMine).toBe(false);
    expect(peerSend.lastMessageSeen).toBe(false);
  });
});

function mapListRow(
  overrides: Partial<InternalListRow> & {
    messages: InternalListRow['messages'];
    readStates: InternalListRow['readStates'];
  },
) {
  return mapInternalListItem(
    {
      id: 'c1',
      zone: 'INTERNAL',
      type: 'INTERNAL_GROUP',
      title: 'Chat',
      status: 'ACTIVE',
      canonicalKey: null,
      createdAt: new Date('2026-08-01T10:00:00.000Z'),
      lastMessageAt: null,
      userSettings: [],
      participants: [],
      ...overrides,
    },
    'e1',
    'ALL',
    new Set(),
  );
}
