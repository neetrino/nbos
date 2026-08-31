import { describe, expect, it } from 'vitest';
import { clientOutboundDeliveryLabel } from './client-delivery-label';
import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';

function row(
  direction: MessengerCoreMessageRow['direction'],
  status: MessengerCoreMessageRow['status'],
): MessengerCoreMessageRow {
  return {
    id: 'm1',
    conversationId: 'c1',
    senderId: 'e1',
    senderName: 'Ada',
    content: 'hi',
    createdAt: '2026-08-31T12:00:00.000Z',
    editedAt: null,
    direction,
    status,
    attachments: [],
  };
}

describe('clientOutboundDeliveryLabel', () => {
  it('labels outbound delivery states and ignores inbound', () => {
    expect(clientOutboundDeliveryLabel(row('OUTBOUND', 'QUEUED'))).toBe('Queued');
    expect(clientOutboundDeliveryLabel(row('OUTBOUND', 'OUTCOME_UNKNOWN'))).toBe(
      'Delivery unknown',
    );
    expect(clientOutboundDeliveryLabel(row('INBOUND', 'SENT'))).toBeNull();
  });
});
