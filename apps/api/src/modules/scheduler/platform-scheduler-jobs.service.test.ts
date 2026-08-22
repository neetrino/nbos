import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import type { AuditService } from '../audit/audit.service';
import { SCHEDULER_JOB_KIND, SCHEDULER_ROSTER_INTENT } from './scheduler-job-catalog';
import {
  computeNextRunAt,
  deriveCatalogStatus,
  PlatformSchedulerJobsService,
  SCHEDULER_CATALOG_STATUS,
} from './platform-scheduler-jobs.service';
import type { SchedulerAiService } from './scheduler-ai.service';
import type { SchedulerJobPolicyService } from './scheduler-job-policy.service';
import type { SchedulerService } from './scheduler.service';
import { SCHEDULER_JOB_NAMES, SCHEDULER_RUN_STATUS } from './scheduler-lease.constants';

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

describe('runJobNow', () => {
  const ACTOR_ID = 'emp-admin';

  function serviceWithMocks() {
    const runAiModelCatalogSync = vi
      .fn()
      .mockResolvedValue({ status: SCHEDULER_RUN_STATUS.SUCCEEDED, runId: 'run-1' });
    const log = vi.fn();
    const service = new PlatformSchedulerJobsService(
      {} as never,
      {} as unknown as SchedulerJobPolicyService,
      { log } as unknown as AuditService,
      {} as unknown as SchedulerService,
      { runAiModelCatalogSync } as unknown as SchedulerAiService,
    );
    return { service, runAiModelCatalogSync, log };
  }

  it('runs the AI catalog sync through its own scheduler service', async () => {
    const { service, runAiModelCatalogSync } = serviceWithMocks();

    const response = await service.runJobNow({
      jobName: SCHEDULER_JOB_NAMES.aiModelCatalogSync,
      actorId: ACTOR_ID,
    });

    expect(runAiModelCatalogSync).toHaveBeenCalledWith('manual_admin');
    expect(response).toEqual({
      jobName: SCHEDULER_JOB_NAMES.aiModelCatalogSync,
      trigger: 'manual_admin',
      result: { status: SCHEDULER_RUN_STATUS.SUCCEEDED, runId: 'run-1' },
    });
  });

  it('audits the manual run with the acting employee', async () => {
    const { service, log } = serviceWithMocks();

    await service.runJobNow({
      jobName: SCHEDULER_JOB_NAMES.aiModelCatalogSync,
      actorId: ACTOR_ID,
    });

    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: SCHEDULER_JOB_NAMES.aiModelCatalogSync,
        userId: ACTOR_ID,
        changes: expect.objectContaining({ trigger: 'manual_admin' }),
      }),
    );
  });

  it('refuses a job name that is not in the catalog, before any dispatch or audit', async () => {
    const { service, runAiModelCatalogSync, log } = serviceWithMocks();

    await expect(service.runJobNow({ jobName: 'not-a-job', actorId: ACTOR_ID })).rejects.toThrow(
      NotFoundException,
    );
    expect(runAiModelCatalogSync).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
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
