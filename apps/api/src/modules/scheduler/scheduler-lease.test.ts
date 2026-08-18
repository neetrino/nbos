import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  assertSchedulerLeaseTiming,
  isEnvFlagEnabled,
  isSchedulerEnabled,
  resolveSchedulerHeartbeatIntervalMs,
  resolveSchedulerLeaseTtlMs,
  SCHEDULER_ENABLED_ENV,
} from './scheduler-lease.constants';
import { SchedulerLeaseService } from './scheduler-lease.service';
import { ScheduledJobRegistry } from './scheduled-job-registry';
import { describeCronSkipReason, shouldStartCronJob } from './scheduler-cron-gate';

describe('scheduler-lease.constants', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('rejects heartbeat >= leaseTTL/2', () => {
    process.env.SCHEDULER_LEASE_TTL_MS = '10000';
    process.env.SCHEDULER_HEARTBEAT_INTERVAL_MS = '6000';
    expect(() => assertSchedulerLeaseTiming()).toThrow(/Invalid scheduler timing/);
  });

  it('accepts valid timing', () => {
    process.env.SCHEDULER_LEASE_TTL_MS = '120000';
    process.env.SCHEDULER_HEARTBEAT_INTERVAL_MS = '30000';
    expect(assertSchedulerLeaseTiming()).toEqual({
      leaseTtlMs: 120000,
      heartbeatIntervalMs: 30000,
    });
    expect(resolveSchedulerLeaseTtlMs()).toBe(120000);
    expect(resolveSchedulerHeartbeatIntervalMs()).toBe(30000);
  });

  it.each([
    ['true', true],
    ['  true  ', true],
    ["'true'", true],
    ['"true"', true],
    ['"TRUE"', true],
    ["'1'", true],
    ['1', true],
    ['yes', true],
    ['false', false],
    ["'false'", false],
    ['', false],
    [undefined, false],
  ] as const)('isSchedulerEnabled(%j) -> %s', (value, expected) => {
    if (value === undefined) {
      delete process.env[SCHEDULER_ENABLED_ENV];
    } else {
      process.env[SCHEDULER_ENABLED_ENV] = value;
    }
    expect(isSchedulerEnabled()).toBe(expected);
  });

  it('isEnvFlagEnabled strips Coolify-style quoted booleans', () => {
    process.env.SCHEDULER_BILLING_ENABLED = "'true'";
    expect(isEnvFlagEnabled('SCHEDULER_BILLING_ENABLED')).toBe(true);
    process.env.SCHEDULER_BILLING_ENABLED = ' false ';
    expect(isEnvFlagEnabled('SCHEDULER_BILLING_ENABLED')).toBe(false);
  });
});

describe('shouldStartCronJob', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('api role never starts cron', () => {
    process.env.NODE_ENV = 'development';
    process.env.PROCESS_ROLE = 'api';
    process.env.SCHEDULER_EXPENSE_PLAN_AUTO_DUE_ENABLED = 'true';
    expect(shouldStartCronJob('SCHEDULER_EXPENSE_PLAN_AUTO_DUE_ENABLED')).toBe(false);
  });

  it('worker role never starts cron', () => {
    process.env.NODE_ENV = 'development';
    process.env.PROCESS_ROLE = 'worker';
    process.env.SCHEDULER_EXPENSE_PLAN_AUTO_DUE_ENABLED = 'true';
    expect(shouldStartCronJob('SCHEDULER_EXPENSE_PLAN_AUTO_DUE_ENABLED')).toBe(false);
  });

  it('scheduler requires SCHEDULER_ENABLED and job flag', () => {
    process.env.NODE_ENV = 'development';
    process.env.PROCESS_ROLE = 'scheduler';
    process.env.SCHEDULER_ENABLED = 'false';
    process.env.SCHEDULER_NOTIFICATION_INBOX_RECONCILE_ENABLED = 'true';
    expect(shouldStartCronJob('SCHEDULER_NOTIFICATION_INBOX_RECONCILE_ENABLED')).toBe(false);

    process.env.SCHEDULER_ENABLED = 'true';
    expect(shouldStartCronJob('SCHEDULER_NOTIFICATION_INBOX_RECONCILE_ENABLED')).toBe(true);
    expect(describeCronSkipReason('SCHEDULER_NOTIFICATION_INBOX_RECONCILE_ENABLED')).toBeNull();
  });

  it('describeCronSkipReason names role vs master vs job flag', () => {
    process.env.NODE_ENV = 'development';
    process.env.PROCESS_ROLE = 'api';
    process.env.SCHEDULER_BILLING_ENABLED = 'true';
    expect(describeCronSkipReason('SCHEDULER_BILLING_ENABLED')).toBe('role=api');

    process.env.PROCESS_ROLE = 'scheduler';
    process.env.SCHEDULER_ENABLED = 'false';
    expect(describeCronSkipReason('SCHEDULER_BILLING_ENABLED')).toBe('SCHEDULER_ENABLED off');

    process.env.SCHEDULER_ENABLED = 'true';
    process.env.SCHEDULER_BILLING_ENABLED = 'false';
    expect(describeCronSkipReason('SCHEDULER_BILLING_ENABLED')).toBe(
      'job flag SCHEDULER_BILLING_ENABLED off',
    );
  });
});

describe('ScheduledJobRegistry', () => {
  it('api assertion fails when jobs registered', () => {
    const registry = new ScheduledJobRegistry();
    registry.register('billing');
    expect(() => registry.assertNoScheduledJobs('api')).toThrow(/must not register/);
  });

  it('scheduler enabled requires jobs', () => {
    const registry = new ScheduledJobRegistry();
    expect(() => registry.assertHasScheduledJobsWhenEnabled(true)).toThrow(/at least one/);
    registry.register('notification-inbox-reconcile');
    expect(() => registry.assertHasScheduledJobsWhenEnabled(true)).not.toThrow();
  });
});

describe('SchedulerLeaseService acquire fencing', () => {
  it('returns null when conflict update matches no rows', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      $executeRaw: vi.fn(),
    };
    const runs = {
      create: vi.fn(),
      touchHeartbeat: vi.fn(),
      finish: vi.fn(),
    };
    const service = new SchedulerLeaseService(prisma as never, runs as never);
    const lease = await service.acquire('job-a', 'owner-1', 60_000);
    expect(lease).toBeNull();
    expect(prisma.$queryRaw).toHaveBeenCalledOnce();
  });

  it('returns handle when insert/update returns row', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([
        {
          job_name: 'job-a',
          owner_id: 'owner-1',
          lease_until: new Date(),
          heartbeat_at: new Date(),
          fencing_token: 3n,
        },
      ]),
      $executeRaw: vi.fn(),
    };
    const runs = { create: vi.fn(), touchHeartbeat: vi.fn(), finish: vi.fn() };
    const service = new SchedulerLeaseService(prisma as never, runs as never);
    const lease = await service.acquire('job-a', 'owner-1', 60_000);
    expect(lease?.fencingToken).toBe(3n);
    expect(lease?.ownerId).toBe('owner-1');
  });

  it('heartbeat and release require matching fencing token (executeRaw 1)', async () => {
    const prisma = {
      $queryRaw: vi.fn(),
      $executeRaw: vi.fn().mockResolvedValue(1),
    };
    const runs = { create: vi.fn(), touchHeartbeat: vi.fn(), finish: vi.fn() };
    const service = new SchedulerLeaseService(prisma as never, runs as never);
    expect(await service.heartbeat('job-a', 'owner-1', 2n, 60_000)).toBe(true);
    expect(await service.release('job-a', 'owner-1', 2n)).toBe(true);
    prisma.$executeRaw.mockResolvedValueOnce(0);
    expect(await service.heartbeat('job-a', 'old-owner', 1n, 60_000)).toBe(false);
  });

  it('runWithLease records SKIPPED_LOCKED when acquire fails', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      $executeRaw: vi.fn(),
    };
    const runs = {
      create: vi.fn().mockResolvedValue({ id: 'run-1' }),
      touchHeartbeat: vi.fn(),
      finish: vi.fn(),
    };
    process.env.SCHEDULER_LEASE_TTL_MS = '120000';
    process.env.SCHEDULER_HEARTBEAT_INTERVAL_MS = '30000';
    const service = new SchedulerLeaseService(prisma as never, runs as never);
    const result = await service.runWithLease(
      { jobName: 'job-a', trigger: 'manual_http' },
      async () => ({ processedCount: 1 }),
    );
    expect(result.status).toBe('SKIPPED_LOCKED');
    expect(runs.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'SKIPPED_LOCKED' }));
  });
});
