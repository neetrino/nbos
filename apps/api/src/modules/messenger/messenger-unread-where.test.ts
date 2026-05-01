import { describe, it, expect } from 'vitest';
import { messengerChannelUnreadWhere, messengerDmUnreadWhere } from './messenger-unread-where';

describe('messengerChannelUnreadWhere', () => {
  it('omits createdAt when no read cursor', () => {
    const w = messengerChannelUnreadWhere('ch-1', 'emp-1', undefined);
    expect(w).toEqual({ channelId: 'ch-1', senderId: { not: 'emp-1' } });
  });

  it('filters by createdAt after cursor', () => {
    const t = new Date('2026-04-30T12:00:00.000Z');
    const w = messengerChannelUnreadWhere('ch-1', 'emp-1', t);
    expect(w).toEqual({
      channelId: 'ch-1',
      senderId: { not: 'emp-1' },
      createdAt: { gt: t },
    });
  });
});

describe('messengerDmUnreadWhere', () => {
  it('omits createdAt when no read cursor', () => {
    const w = messengerDmUnreadWhere('th-1', 'emp-2', undefined);
    expect(w).toEqual({ threadId: 'th-1', senderId: { not: 'emp-2' } });
  });
});
