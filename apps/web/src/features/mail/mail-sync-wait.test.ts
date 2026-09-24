import { describe, expect, it, vi } from 'vitest';
import {
  isMailProviderSyncableStatus,
  mailAccountsForProviderSync,
  resolveMailSyncSettleState,
  resolveMailSyncWaitOutcome,
  waitUntilMailSyncSettles,
  type MailSyncWaitSnapshot,
} from './mail-sync-wait';

function snapshot(partial: Partial<MailSyncWaitSnapshot>): MailSyncWaitSnapshot {
  return {
    lastSyncAt: null,
    lastErrorAt: null,
    status: 'ACTIVE',
    ...partial,
  };
}

describe('mailAccountsForProviderSync', () => {
  const accounts = [
    { id: 'a', status: 'ACTIVE' },
    { id: 'b', status: 'DEGRADED' },
    { id: 'c', status: 'NEEDS_RECONNECT' },
    { id: 'd', status: 'PAUSED' },
  ];

  it('syncs ACTIVE and DEGRADED when no mailbox is selected', () => {
    expect(mailAccountsForProviderSync(accounts, null).map((row) => row.id)).toEqual(['a', 'b']);
  });

  it('syncs only the selected mailbox when it is eligible', () => {
    expect(mailAccountsForProviderSync(accounts, 'a').map((row) => row.id)).toEqual(['a']);
    expect(mailAccountsForProviderSync(accounts, 'c')).toEqual([]);
  });

  it('recognizes syncable statuses', () => {
    expect(isMailProviderSyncableStatus('SYNCING')).toBe(true);
    expect(isMailProviderSyncableStatus('DISABLED')).toBe(false);
  });
});

describe('resolveMailSyncSettleState', () => {
  it('completes when lastSyncAt advances', () => {
    expect(
      resolveMailSyncSettleState(
        snapshot({ lastSyncAt: '2026-01-01T00:00:00.000Z' }),
        snapshot({ lastSyncAt: '2026-01-01T00:01:00.000Z' }),
      ),
    ).toBe('completed');
  });

  it('fails when lastErrorAt advances or reconnect is required', () => {
    expect(
      resolveMailSyncSettleState(
        snapshot({ lastErrorAt: null }),
        snapshot({ lastErrorAt: '2026-01-01T00:01:00.000Z', status: 'DEGRADED' }),
      ),
    ).toBe('failed');
    expect(
      resolveMailSyncSettleState(
        snapshot({ status: 'ACTIVE' }),
        snapshot({ status: 'NEEDS_RECONNECT' }),
      ),
    ).toBe('failed');
  });

  it('stays pending until a cursor or error changes', () => {
    expect(
      resolveMailSyncSettleState(
        snapshot({ lastSyncAt: '2026-01-01T00:00:00.000Z', status: 'ACTIVE' }),
        snapshot({ lastSyncAt: '2026-01-01T00:00:00.000Z', status: 'SYNCING' }),
      ),
    ).toBe('pending');
  });
});

describe('resolveMailSyncWaitOutcome', () => {
  it('is pending while any mailbox is still running', () => {
    expect(resolveMailSyncWaitOutcome(['completed', 'pending'])).toBe('pending');
  });

  it('fails when every mailbox settled and at least one failed', () => {
    expect(resolveMailSyncWaitOutcome(['completed', 'failed'])).toBe('failed');
  });
});

describe('waitUntilMailSyncSettles', () => {
  it('returns completed after lastSyncAt changes', async () => {
    const baseline = snapshot({ lastSyncAt: 't0' });
    const loadSnapshots = vi
      .fn()
      .mockResolvedValueOnce(new Map([['a', baseline]]))
      .mockResolvedValueOnce(new Map([['a', snapshot({ lastSyncAt: 't1' })]]));

    await expect(
      waitUntilMailSyncSettles({
        accountIds: ['a'],
        baselineById: new Map([['a', baseline]]),
        loadSnapshots,
        pollMs: 1,
        timeoutMs: 100,
        sleep: async () => undefined,
        now: (() => {
          let tick = 0;
          return () => {
            tick += 1;
            return tick;
          };
        })(),
      }),
    ).resolves.toBe('completed');
  });

  it('returns timeout when the cursor never advances', async () => {
    const baseline = snapshot({ lastSyncAt: 't0' });
    let now = 0;
    await expect(
      waitUntilMailSyncSettles({
        accountIds: ['a'],
        baselineById: new Map([['a', baseline]]),
        loadSnapshots: async () => new Map([['a', baseline]]),
        pollMs: 1,
        timeoutMs: 2,
        sleep: async () => undefined,
        now: () => {
          now += 1;
          return now;
        },
      }),
    ).resolves.toBe('timeout');
  });
});
