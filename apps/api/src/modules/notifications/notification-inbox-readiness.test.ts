import { describe, expect, it } from 'vitest';
import {
  evaluateInboxStateReadiness,
  type InboxDryRunReport,
} from './notification-inbox-readiness';

function baseReport(partial: Partial<InboxDryRunReport> = {}): InboxDryRunReport {
  return {
    scanned: 10,
    matched: 10,
    drifted: 0,
    missing: 0,
    negative: 0,
    maxAbsoluteDrift: 0,
    repaired: 0,
    mode: 'dry-run',
    ...partial,
  };
}

describe('evaluateInboxStateReadiness', () => {
  it('returns READY when drift/missing/negative are zero and flags on', () => {
    const result = evaluateInboxStateReadiness({
      report: baseReport(),
      writeEnabled: true,
      reconcileEnabled: true,
      lastReconciliationSucceeded: true,
    });
    expect(result.decision).toBe('READY');
    expect(result.reasons).toEqual([]);
  });

  it('returns NOT_READY on drifted rows', () => {
    const result = evaluateInboxStateReadiness({
      report: baseReport({ drifted: 1, matched: 9, maxAbsoluteDrift: 1 }),
      writeEnabled: true,
      reconcileEnabled: true,
      lastReconciliationSucceeded: true,
    });
    expect(result.decision).toBe('NOT_READY');
    expect(result.reasons.some((r) => r.startsWith('DRIFTED='))).toBe(true);
  });

  it('returns NOT_READY when WRITE disabled', () => {
    const result = evaluateInboxStateReadiness({
      report: baseReport(),
      writeEnabled: false,
      reconcileEnabled: true,
      lastReconciliationSucceeded: true,
    });
    expect(result.decision).toBe('NOT_READY');
    expect(result.reasons).toContain('WRITE_DISABLED');
  });
});
