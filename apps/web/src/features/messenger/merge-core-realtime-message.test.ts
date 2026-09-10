import { describe, expect, it } from 'vitest';
import { mergeCoreRealtimeMessage } from './merge-core-realtime-message';
import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';

function row(id: string, status: MessengerCoreMessageRow['status']): MessengerCoreMessageRow {
  return {
    id,
    conversationId: 'c1',
    senderId: 'e1',
    senderName: 'Ada',
    content: 'hi',
    createdAt: '2026-08-31T12:00:00.000Z',
    editedAt: null,
    status,
    direction: 'OUTBOUND',
    attachments: [],
  };
}

describe('mergeCoreRealtimeMessage', () => {
  it('appends a new id and replaces status on an existing id', () => {
    const queued = row('m1', 'QUEUED');
    const sent = row('m1', 'SENT');
    expect(mergeCoreRealtimeMessage([], queued)).toEqual([queued]);
    expect(mergeCoreRealtimeMessage([queued], sent)[0]?.status).toBe('SENT');
  });

  it('keeps DELIVERED when a late SENT event arrives', () => {
    const delivered = row('m1', 'DELIVERED');
    const sent = row('m1', 'SENT');
    expect(mergeCoreRealtimeMessage([delivered], sent)[0]?.status).toBe('DELIVERED');
  });

  it('does not let late SENDING overwrite SENT', () => {
    const sent = row('m1', 'SENT');
    const sending = row('m1', 'SENDING');
    expect(mergeCoreRealtimeMessage([sent], sending)[0]?.status).toBe('SENT');
  });

  it('is idempotent for duplicate delivery events', () => {
    const sent = row('m1', 'SENT');
    expect(mergeCoreRealtimeMessage([sent], sent)[0]?.status).toBe('SENT');
  });
});
