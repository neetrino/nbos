import { describe, expect, it, vi } from 'vitest';
import { isGmailHistoryGoneError, resolveGmailDeltaMessageIds } from './gmail-history';

describe('resolveGmailDeltaMessageIds', () => {
  it('recovers last-30 INBOX when history.list returns 410', async () => {
    const listHistory = vi.fn().mockRejectedValue({ status: 410, message: 'historyId expired' });
    const listRecent = vi.fn().mockResolvedValue(['m1', 'm2']);
    const ids = await resolveGmailDeltaMessageIds({
      historyId: '12345',
      listHistory,
      listRecent,
    });
    expect(isGmailHistoryGoneError({ status: 410 })).toBe(true);
    expect(listHistory).toHaveBeenCalledWith('12345');
    expect(listRecent).toHaveBeenCalledOnce();
    expect(ids).toEqual(['m1', 'm2']);
  });

  it('recovers on Gmail 404 history gone', async () => {
    const ids = await resolveGmailDeltaMessageIds({
      historyId: 'old',
      listHistory: vi.fn().mockRejectedValue({ code: 404 }),
      listRecent: vi.fn().mockResolvedValue(['inbox-1']),
    });
    expect(ids).toEqual(['inbox-1']);
  });

  it('rethrows transient history errors', async () => {
    await expect(
      resolveGmailDeltaMessageIds({
        historyId: '123',
        listHistory: vi.fn().mockRejectedValue({ status: 503, message: 'unavailable' }),
        listRecent: vi.fn(),
      }),
    ).rejects.toMatchObject({ status: 503 });
  });
});
