import { describe, it, expect } from 'vitest';
import {
  dmReadReceiptMessageId,
  MESSENGER_DM_READ_RECEIPT_LABEL,
} from './messenger-dm-read-receipt.util';

describe('dmReadReceiptMessageId', () => {
  it('returns null when peer never read', () => {
    expect(
      dmReadReceiptMessageId(
        [{ id: '1', senderId: 'me', timestamp: '2026-04-30T10:00:00.000Z' }],
        'me',
        null,
      ),
    ).toBeNull();
  });

  it('returns latest own message at or before peer cursor', () => {
    const peerRead = '2026-04-30T10:05:00.000Z';
    const messages = [
      { id: 'a', senderId: 'them', timestamp: '2026-04-30T10:00:00.000Z' },
      { id: 'b', senderId: 'me', timestamp: '2026-04-30T10:01:00.000Z' },
      { id: 'c', senderId: 'me', timestamp: '2026-04-30T10:06:00.000Z' },
    ];
    expect(dmReadReceiptMessageId(messages, 'me', peerRead)).toBe('b');
  });
});

describe('MESSENGER_DM_READ_RECEIPT_LABEL', () => {
  it('is stable copy', () => {
    expect(MESSENGER_DM_READ_RECEIPT_LABEL).toBe('Read');
  });
});
