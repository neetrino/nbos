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

  it('does not regress READ when a late DELIVERED event arrives', () => {
    const read = row('m1', 'READ');
    const delivered = row('m1', 'DELIVERED');
    expect(mergeCoreRealtimeMessage([read], delivered)[0]?.status).toBe('READ');
    expect(mergeCoreRealtimeMessage([read], delivered)).toHaveLength(1);
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

  it('removes an open row when the provider revoke sets deletedAt', () => {
    const live = row('m1', 'DELIVERED');
    const tombstone = row('m1', 'DELIVERED');
    tombstone.deletedAt = '2026-10-01T12:05:00.000Z';
    expect(mergeCoreRealtimeMessage([live], tombstone)).toEqual([]);
    expect(mergeCoreRealtimeMessage([], tombstone)).toEqual([]);
  });

  it('is idempotent for duplicate delivery events', () => {
    const sent = row('m1', 'SENT');
    expect(mergeCoreRealtimeMessage([sent], sent)[0]?.status).toBe('SENT');
  });

  it('replaces one optimistic row when either side arrives first', () => {
    const optimistic = row('local:k1', 'QUEUED');
    optimistic.status = undefined;
    optimistic.idempotencyKey = 'k1';
    optimistic.localSend = { idempotencyKey: 'k1', phase: 'sending' };
    const canonical = row('srv', 'SENT');
    canonical.idempotencyKey = 'k1';
    const afterSocket = mergeCoreRealtimeMessage([optimistic], canonical);
    expect(afterSocket.map((item) => item.id)).toEqual(['srv']);
    expect(afterSocket[0]?.localSend).toBeUndefined();
    const afterHttp = mergeCoreRealtimeMessage(afterSocket, canonical);
    expect(afterHttp).toHaveLength(1);
    const httpFirst = mergeCoreRealtimeMessage([optimistic], canonical);
    const socketLater = mergeCoreRealtimeMessage(httpFirst, { ...canonical, status: 'DELIVERED' });
    expect(socketLater).toHaveLength(1);
    expect(socketLater[0]?.id).toBe('srv');
    expect(socketLater[0]?.status).toBe('DELIVERED');
    expect(socketLater[0]?.localSend).toBeUndefined();
  });
});
