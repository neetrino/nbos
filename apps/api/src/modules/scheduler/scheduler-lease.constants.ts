export const SCHEDULER_ENABLED_ENV = 'SCHEDULER_ENABLED';
export const SCHEDULER_LEASE_TTL_MS_ENV = 'SCHEDULER_LEASE_TTL_MS';
export const SCHEDULER_HEARTBEAT_INTERVAL_MS_ENV = 'SCHEDULER_HEARTBEAT_INTERVAL_MS';
export const SCHEDULER_HEALTH_PORT_ENV = 'SCHEDULER_HEALTH_PORT';
export const SCHEDULER_SHUTDOWN_TIMEOUT_MS_ENV = 'SCHEDULER_SHUTDOWN_TIMEOUT_MS';

export const DEFAULT_SCHEDULER_LEASE_TTL_MS = 120_000;
export const DEFAULT_SCHEDULER_HEARTBEAT_INTERVAL_MS = 30_000;
export const DEFAULT_SCHEDULER_SHUTDOWN_TIMEOUT_MS = 45_000;

/** Stable machine names for leases / runs / cron registry. */
export const SCHEDULER_JOB_NAMES = {
  expensePlanAutoDue: 'expense-plan-auto-due',
  reportSchedulesDue: 'report-schedules-due',
  credentialTrashPurge: 'credential-trash-purge',
  platformTrashPurge: 'platform-trash-purge',
  notificationInboxReconcile: 'notification-inbox-reconcile',
  billing: 'billing',
  expenses: 'expenses',
  overdueInvoices: 'overdue-invoices',
  invoiceCardReminders: 'invoice-card-reminders',
  expenseBacklogReminders: 'expense-backlog-reminders',
  salesKpiMonthClose: 'sales-kpi-month-close',
  supportSlaEscalation: 'support-sla-escalation',
  whatsappProductGroupsReconcile: 'whatsapp-product-groups-reconcile',
} as const;

export type SchedulerJobName = (typeof SCHEDULER_JOB_NAMES)[keyof typeof SCHEDULER_JOB_NAMES];

export const SCHEDULER_RUN_STATUS = {
  RUNNING: 'RUNNING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  SKIPPED_LOCKED: 'SKIPPED_LOCKED',
  TIMED_OUT: 'TIMED_OUT',
  CANCELLED: 'CANCELLED',
} as const;

export type SchedulerRunStatus = (typeof SCHEDULER_RUN_STATUS)[keyof typeof SCHEDULER_RUN_STATUS];

export const SCHEDULER_TRIGGER = {
  cron: 'cron',
  manualHttp: 'manual_http',
} as const;

export type SchedulerTrigger = (typeof SCHEDULER_TRIGGER)[keyof typeof SCHEDULER_TRIGGER];

function parsePositiveInt(raw: string | undefined, fallback: number, envKey: string): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  if (!/^\d+$/.test(raw.trim())) {
    throw new Error(`Invalid ${envKey}="${raw}": must be a positive integer`);
  }
  const value = Number(raw.trim());
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`Invalid ${envKey}=${value}: must be >= 1`);
  }
  return value;
}

export function resolveSchedulerLeaseTtlMs(env: NodeJS.ProcessEnv = process.env): number {
  return parsePositiveInt(
    env[SCHEDULER_LEASE_TTL_MS_ENV],
    DEFAULT_SCHEDULER_LEASE_TTL_MS,
    SCHEDULER_LEASE_TTL_MS_ENV,
  );
}

export function resolveSchedulerHeartbeatIntervalMs(env: NodeJS.ProcessEnv = process.env): number {
  return parsePositiveInt(
    env[SCHEDULER_HEARTBEAT_INTERVAL_MS_ENV],
    DEFAULT_SCHEDULER_HEARTBEAT_INTERVAL_MS,
    SCHEDULER_HEARTBEAT_INTERVAL_MS_ENV,
  );
}

/** Fail startup when heartbeat >= leaseTTL/2. */
export function assertSchedulerLeaseTiming(env: NodeJS.ProcessEnv = process.env): {
  leaseTtlMs: number;
  heartbeatIntervalMs: number;
} {
  const leaseTtlMs = resolveSchedulerLeaseTtlMs(env);
  const heartbeatIntervalMs = resolveSchedulerHeartbeatIntervalMs(env);
  if (heartbeatIntervalMs >= leaseTtlMs / 2) {
    throw new Error(
      `Invalid scheduler timing: ${SCHEDULER_HEARTBEAT_INTERVAL_MS_ENV}=${heartbeatIntervalMs} must be < ${SCHEDULER_LEASE_TTL_MS_ENV}/2 (${leaseTtlMs / 2})`,
    );
  }
  return { leaseTtlMs, heartbeatIntervalMs };
}

export function isSchedulerEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env[SCHEDULER_ENABLED_ENV]?.trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes';
}

export function isEnvFlagEnabled(envKey: string, env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env[envKey]?.trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes';
}
