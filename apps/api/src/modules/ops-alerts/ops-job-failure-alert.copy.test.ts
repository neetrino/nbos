import { describe, expect, it } from 'vitest';
import { SCHEDULER_JOB_NAMES } from '../scheduler/scheduler-lease.constants';
import {
  buildBullmqFailureCopy,
  buildSchedulerFailureCopy,
  opsAlertHourBucket,
  sanitizeOpsAlertErrorMessage,
} from './ops-job-failure-alert.copy';

describe('ops-job-failure-alert.copy', () => {
  it('uses catalog title and Scheduler settings link', () => {
    const copy = buildSchedulerFailureCopy({
      jobName: SCHEDULER_JOB_NAMES.billing,
      status: 'FAILED',
      errorCode: 'Error',
      errorMessage: 'db timeout',
    });
    expect(copy.title).toBe('Scheduler failed: Monthly billing');
    expect(copy.body).toContain('billing');
    expect(copy.body).toContain('db timeout');
    expect(copy.link).toBe('/settings/scheduler');
    expect(copy.actionLabel).toBe('Open Scheduler');
  });

  it('maps known BullMQ queues to module pages', () => {
    const copy = buildBullmqFailureCopy({
      queue: 'mail',
      jobName: 'mail-send',
      attempts: 3,
      errorMessage: 'SMTP down',
    });
    expect(copy.title).toBe('Queue job failed: mail-send');
    expect(copy.body).toContain('3 attempt');
    expect(copy.link).toBe('/mail');
  });

  it('sanitizes empty and long error text', () => {
    expect(sanitizeOpsAlertErrorMessage('   ')).toBe('No error message');
    expect(sanitizeOpsAlertErrorMessage('x'.repeat(400)).length).toBe(280);
  });

  it('buckets dedupe by UTC hour', () => {
    expect(opsAlertHourBucket(new Date('2026-08-20T13:44:01.000Z'))).toBe('2026-08-20T13');
  });
});
