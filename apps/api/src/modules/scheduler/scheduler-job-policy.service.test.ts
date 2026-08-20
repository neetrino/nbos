import { describe, expect, it } from 'vitest';
import { SCHEDULER_ROSTER_INTENT } from './scheduler-job-catalog';
import { resolveSeedEnabled } from './scheduler-job-policy.service';

describe('resolveSeedEnabled', () => {
  const entry = {
    jobName: 'billing' as const,
    title: 'Billing',
    description: 'x',
    ownerModule: 'Finance',
    group: 'Money' as const,
    defaultExpression: '0 3 1 * *',
    enabledEnvKey: 'SCHEDULER_BILLING_ENABLED',
    cronEnvKey: 'SCHEDULER_BILLING_CRON',
    risk: 'high' as const,
    kind: 'platform_cron' as const,
    rosterIntent: SCHEDULER_ROSTER_INTENT.on,
    visibility: 'list' as const,
  };

  it('uses env when set', () => {
    expect(resolveSeedEnabled(entry, { SCHEDULER_BILLING_ENABLED: 'true' })).toBe(true);
    expect(resolveSeedEnabled(entry, { SCHEDULER_BILLING_ENABLED: 'false' })).toBe(false);
  });

  it('falls back to rosterIntent when env unset', () => {
    expect(resolveSeedEnabled(entry, {})).toBe(true);
    expect(resolveSeedEnabled({ ...entry, rosterIntent: SCHEDULER_ROSTER_INTENT.off }, {})).toBe(
      false,
    );
  });
});
