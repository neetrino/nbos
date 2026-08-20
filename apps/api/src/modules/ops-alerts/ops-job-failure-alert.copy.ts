import { getSchedulerJobCatalogEntry } from '../scheduler/scheduler-job-catalog';
import {
  BULLMQ_FAILURE_LINK_BY_QUEUE,
  OPS_ALERT_ERROR_MESSAGE_MAX,
  OPS_ALERT_SCHEDULER_SETTINGS_PATH,
} from './ops-job-failure-alert.constants';

export type OpsAlertCopy = {
  title: string;
  body: string;
  link: string;
  actionLabel: string;
};

export function sanitizeOpsAlertErrorMessage(raw: string | undefined): string {
  if (!raw) return 'No error message';
  const compact = raw.replace(/\s+/g, ' ').trim();
  if (compact.length === 0) return 'No error message';
  return compact.slice(0, OPS_ALERT_ERROR_MESSAGE_MAX);
}

export function opsAlertHourBucket(now: Date = new Date()): string {
  return now.toISOString().slice(0, 13);
}

export function buildSchedulerFailureCopy(input: {
  jobName: string;
  status: string;
  errorCode?: string;
  errorMessage?: string;
}): OpsAlertCopy {
  const titleName = getSchedulerJobCatalogEntry(input.jobName)?.title ?? input.jobName;
  const detail = formatFailureDetail(input.errorCode, input.errorMessage);
  return {
    title: `Scheduler failed: ${titleName}`,
    body: `${titleName} (${input.jobName}) ended as ${input.status}. ${detail} Open Settings → Scheduler to inspect the last run.`,
    link: OPS_ALERT_SCHEDULER_SETTINGS_PATH,
    actionLabel: 'Open Scheduler',
  };
}

export function buildBullmqFailureCopy(input: {
  queue: string;
  jobName: string;
  attempts: number;
  errorMessage?: string;
}): OpsAlertCopy {
  const detail = sanitizeOpsAlertErrorMessage(input.errorMessage);
  return {
    title: `Queue job failed: ${input.jobName}`,
    body: `The ${input.queue} queue job ${input.jobName} failed after ${input.attempts} attempt(s). Error: ${detail}`,
    link: BULLMQ_FAILURE_LINK_BY_QUEUE[input.queue] ?? OPS_ALERT_SCHEDULER_SETTINGS_PATH,
    actionLabel: 'Open related page',
  };
}

function formatFailureDetail(
  errorCode: string | undefined,
  errorMessage: string | undefined,
): string {
  const message = sanitizeOpsAlertErrorMessage(errorMessage);
  if (errorCode && errorCode !== 'Error') {
    return `Error: ${errorCode} — ${message}`;
  }
  return `Error: ${message}`;
}
