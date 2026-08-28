import { describe, expect, it } from 'vitest';
import type { PlatformSchedulerJobRow } from '@/lib/api/scheduler-jobs';
import { filterSchedulerJobs } from './filter-scheduler-jobs';

function job(
  partial: Partial<PlatformSchedulerJobRow> & Pick<PlatformSchedulerJobRow, 'jobName'>,
): PlatformSchedulerJobRow {
  return {
    title: partial.title ?? partial.jobName,
    description: partial.description ?? '',
    ownerModule: partial.ownerModule ?? 'finance',
    group: partial.group ?? 'Money',
    risk: partial.risk ?? 'low',
    kind: partial.kind ?? 'platform_cron',
    rosterIntent: partial.rosterIntent ?? 'on',
    defaultExpression: partial.defaultExpression ?? '0 3 * * *',
    expression: partial.expression ?? '0 3 * * *',
    timezone: partial.timezone ?? 'Asia/Yerevan',
    status: partial.status ?? 'active',
    enabledByEnv: partial.enabledByEnv ?? null,
    policyEnabled: partial.policyEnabled ?? true,
    masterEnabled: partial.masterEnabled ?? true,
    registered: partial.registered ?? true,
    lastRunAt: partial.lastRunAt ?? null,
    lastRunStatus: partial.lastRunStatus ?? null,
    lastErrorMessage: partial.lastErrorMessage ?? null,
    nextRunAt: partial.nextRunAt ?? null,
    runtimeHeartbeatAt: partial.runtimeHeartbeatAt ?? null,
    canToggle: partial.canToggle ?? true,
    canRunNow: partial.canRunNow ?? true,
    ...partial,
  };
}

const catalog = [
  job({
    jobName: 'billing',
    title: 'Monthly billing',
    group: 'Money',
    ownerModule: 'finance',
    description: 'Issue monthly invoices',
  }),
  job({
    jobName: 'platform-trash-purge',
    title: 'Platform trash purge',
    group: 'Trash',
    ownerModule: 'platform',
    description: 'Purge expired trash',
  }),
];

describe('filterSchedulerJobs', () => {
  it('returns all jobs when search is empty', () => {
    expect(filterSchedulerJobs(catalog, '   ')).toEqual(catalog);
  });

  it('matches title, slug, group, and description', () => {
    expect(filterSchedulerJobs(catalog, 'billing').map((row) => row.jobName)).toEqual(['billing']);
    expect(filterSchedulerJobs(catalog, 'trash').map((row) => row.jobName)).toEqual([
      'platform-trash-purge',
    ]);
    expect(filterSchedulerJobs(catalog, 'Money').map((row) => row.jobName)).toEqual(['billing']);
    expect(filterSchedulerJobs(catalog, 'expired').map((row) => row.jobName)).toEqual([
      'platform-trash-purge',
    ]);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterSchedulerJobs(catalog, 'reports')).toEqual([]);
  });
});
