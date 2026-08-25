import { describe, expect, it } from 'vitest';
import { shouldSyncClickToCallFromHistory } from './ats-click-to-call-live-reconcile.guard';

const CREATED = new Date('2026-08-24T17:30:22.000Z');

describe('shouldSyncClickToCallFromHistory', () => {
  it('waits for min age on a pending click-to-call', () => {
    expect(
      shouldSyncClickToCallFromHistory({
        source: 'CLICK_TO_CALL',
        state: 'initiated',
        createdAt: CREATED,
        now: new Date(CREATED.getTime() + 3_000),
      }),
    ).toBe(false);
    expect(
      shouldSyncClickToCallFromHistory({
        source: 'CLICK_TO_CALL',
        state: 'initiated',
        createdAt: CREATED,
        now: new Date(CREATED.getTime() + 9_000),
      }),
    ).toBe(true);
  });

  it('skips terminal calls, non-click-to-call, and cooldown', () => {
    const now = new Date(CREATED.getTime() + 20_000);
    expect(
      shouldSyncClickToCallFromHistory({
        source: 'CLICK_TO_CALL',
        state: 'end',
        createdAt: CREATED,
        now,
      }),
    ).toBe(false);
    expect(
      shouldSyncClickToCallFromHistory({
        source: null,
        state: 'initiated',
        createdAt: CREATED,
        now,
      }),
    ).toBe(false);
    expect(
      shouldSyncClickToCallFromHistory({
        source: 'CLICK_TO_CALL',
        state: 'initiated',
        createdAt: CREATED,
        now,
        lastAttemptAt: now.getTime() - 1_000,
      }),
    ).toBe(false);
  });
});
