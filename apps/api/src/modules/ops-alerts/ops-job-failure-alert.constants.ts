export const OPS_ALERT_EVENT_SCHEDULER_RUN_FAILED = 'ops.scheduler_run_failed' as const;
export const OPS_ALERT_EVENT_BULLMQ_JOB_FAILED = 'ops.bullmq_job_failed' as const;

export const OPS_ALERT_CATEGORY = 'system_health' as const;
export const OPS_ALERT_PRIORITY = 'high' as const;
export const OPS_ALERT_SOURCE_MODULE = 'ops-alerts' as const;

export const OPS_ALERT_ENTITY_SCHEDULER_JOB = 'scheduler_job' as const;
export const OPS_ALERT_ENTITY_BULLMQ_QUEUE = 'bullmq_queue' as const;

export const OPS_ALERT_ERROR_MESSAGE_MAX = 280;
export const OPS_ALERT_SCHEDULER_SETTINGS_PATH = '/settings/scheduler';

/** CEO is the operational executive recipient. Founder comes from PlatformOwnership. */
export const OPS_ALERT_RECIPIENT_STATUSES = ['ACTIVE', 'PROBATION'] as const;

export const BULLMQ_FAILURE_LINK_BY_QUEUE: Readonly<Record<string, string>> = {
  mail: '/mail',
  'reports.export-jobs': '/reports',
  'drive.zip-export-jobs': '/drive',
  'whatsapp.product-groups': '/settings',
  'ats-call-recording': '/crm',
};
