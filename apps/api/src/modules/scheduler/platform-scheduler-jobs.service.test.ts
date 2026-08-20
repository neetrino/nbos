import { describe, expect, it } from 'vitest';
import { SCHEDULER_JOB_KIND, SCHEDULER_ROSTER_INTENT } from './scheduler-job-catalog';
import {
  computeNextRunAt,
  deriveCatalogStatus,
  SCHEDULER_CATALOG_STATUS,
} from './platform-scheduler-jobs.service';
import { SCHEDULER_RUN_STATUS } from './scheduler-lease.constants';

const baseEntry = {
  jobName: 'billing' as const,
  title: 'Billing',
  description: 'test',
  ownerModule: 'Finance',
  group: 'Money' as const,
  defaultExpression: '0 3 1 * *',
  enabledEnvKey: 'SCHEDULER_BILLING_ENABLED',
  cronEnvKey: 'SCHEDULER_BILLING_CRON',
  risk: 'high' as const,
  kind: SCHEDULER_JOB_KIND.platformCron,
  rosterIntent: SCHEDULER_ROSTER_INTENT.on,
  visibility: 'list' as const,
};

describe('deriveCatalogStatus', () => {
  it('returns manual for manual_only jobs', () => {
    expect(
      deriveCatalogStatus({
        entry: { ...baseEntry, kind: SCHEDULER_JOB_KIND.manualOnly },
        runtime: null,
        lastRun: null,
        lease: null,
        policyEnabled: null,
        schedulerOnline: true,
        now: Date.now(),
      }),
    ).toBe(SCHEDULER_CATALOG_STATUS.manual);
  });

  it('returns schedulerOffline when no fresh runtime', () => {
    expect(
      deriveCatalogStatus({
        entry: baseEntry,
        runtime: null,
        lastRun: null,
        lease: null,
        policyEnabled: true,
        schedulerOnline: false,
        now: Date.now(),
      }),
    ).toBe(SCHEDULER_CATALOG_STATUS.schedulerOffline);
  });

  it('returns paused when policy off', () => {
    const now = Date.now();
    expect(
      deriveCatalogStatus({
        entry: baseEntry,
        runtime: {
          jobName: 'billing',
          masterEnabled: true,
          registered: true,
          expression: '0 3 1 * *',
          timezone: 'Asia/Yerevan',
          heartbeatAt: new Date(now),
        },
        lastRun: null,
        lease: null,
        policyEnabled: false,
        schedulerOnline: true,
        now,
      }),
    ).toBe(SCHEDULER_CATALOG_STATUS.paused);
  });

  it('returns blocked when master off but policy on', () => {
    const now = Date.now();
    expect(
      deriveCatalogStatus({
        entry: baseEntry,
        runtime: {
          jobName: 'billing',
          masterEnabled: false,
          registered: true,
          expression: '0 3 1 * *',
          timezone: 'Asia/Yerevan',
          heartbeatAt: new Date(now),
        },
        lastRun: null,
        lease: null,
        policyEnabled: true,
        schedulerOnline: true,
        now,
      }),
    ).toBe(SCHEDULER_CATALOG_STATUS.blocked);
  });

  it('returns failed when last run failed', () => {
    const now = Date.now();
    expect(
      deriveCatalogStatus({
        entry: baseEntry,
        runtime: {
          jobName: 'billing',
          masterEnabled: true,
          registered: true,
          expression: '0 3 1 * *',
          timezone: 'Asia/Yerevan',
          heartbeatAt: new Date(now),
        },
        lastRun: {
          jobName: 'billing',
          status: SCHEDULER_RUN_STATUS.FAILED,
          startedAt: new Date(now - 60_000),
          finishedAt: new Date(now - 59_000),
          errorMessage: 'boom',
        },
        lease: null,
        policyEnabled: true,
        schedulerOnline: true,
        now,
      }),
    ).toBe(SCHEDULER_CATALOG_STATUS.failed);
  });

  it('returns active when master on, registered, policy on', () => {
    const now = Date.now();
    expect(
      deriveCatalogStatus({
        entry: baseEntry,
        runtime: {
          jobName: 'billing',
          masterEnabled: true,
          registered: true,
          expression: '0 3 1 * *',
          timezone: 'Asia/Yerevan',
          heartbeatAt: new Date(now),
        },
        lastRun: {
          jobName: 'billing',
          status: SCHEDULER_RUN_STATUS.SUCCEEDED,
          startedAt: new Date(now - 60_000),
          finishedAt: new Date(now - 59_000),
          errorMessage: null,
        },
        lease: null,
        policyEnabled: true,
        schedulerOnline: true,
        now,
      }),
    ).toBe(SCHEDULER_CATALOG_STATUS.active);
  });
});

describe('computeNextRunAt', () => {
  it('returns ISO string for valid cron', () => {
    const next = computeNextRunAt('0 3 1 * *', 'Asia/Yerevan');
    expect(next).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('returns null for invalid cron', () => {
    expect(computeNextRunAt('not-a-cron', 'Asia/Yerevan')).toBeNull();
  });
});
