export const NOTIFICATION_EVENT_TYPE_MESSAGE_KEYS = {
  'finance.wallet.bonus_active': 'eventTypes.financeWalletBonusActive',
  'finance.wallet.bonus_paid': 'eventTypes.financeWalletBonusPaid',
  'finance.wallet.bonus_corrected': 'eventTypes.financeWalletBonusCorrected',
  'finance.wallet.bonus_kpi_reduced': 'eventTypes.financeWalletBonusKpiReduced',
  'finance.wallet.bonus_carry_applied': 'eventTypes.financeWalletBonusCarryApplied',
  'finance.wallet.bonus_carry_deferred': 'eventTypes.financeWalletBonusCarryDeferred',
  'finance.wallet.payroll_created': 'eventTypes.financeWalletPayrollCreated',
  'finance.wallet.payroll_closed': 'eventTypes.financeWalletPayrollClosed',
  'finance.wallet.salary_payment': 'eventTypes.financeWalletSalaryPayment',
  'finance.invoice.official_request_due': 'eventTypes.financeInvoiceOfficialRequestDue',
  'finance.invoice.payment_reminder_due': 'eventTypes.financeInvoicePaymentReminderDue',
  'finance.invoice.payment_reminder_d10': 'eventTypes.financeInvoicePaymentReminderD10',
  'finance.invoice.payment_reminder_d2': 'eventTypes.financeInvoicePaymentReminderD2',
  'finance.invoice.overdue_reminder_w1': 'eventTypes.financeInvoiceOverdueReminderW1',
  'finance.invoice.overdue_reminder_w2': 'eventTypes.financeInvoiceOverdueReminderW2',
  'finance.expense.backlog_weekly_digest': 'eventTypes.financeExpenseBacklogWeeklyDigest',
  'finance.expense.backlog_due_overdue': 'eventTypes.financeExpenseBacklogDueOverdue',
  'task.overdue': 'eventTypes.taskOverdue',
  'finance.overdue': 'eventTypes.financeOverdue',
  'mail.health_degraded': 'eventTypes.mailHealthDegraded',
  'mail.send_failed': 'eventTypes.mailSendFailed',
  'ops.scheduler_run_failed': 'eventTypes.opsSchedulerRunFailed',
  'ops.bullmq_job_failed': 'eventTypes.opsBullmqJobFailed',
  'document.access_changed': 'eventTypes.documentAccessChanged',
  'credentials.high_risk_action': 'eventTypes.credentialsHighRiskAction',
  'support.sla.resolve_warning': 'eventTypes.supportSlaResolveWarning',
  'support.sla.response_breached': 'eventTypes.supportSlaResponseBreached',
  'support.sla.resolve_breached': 'eventTypes.supportSlaResolveBreached',
  'support.escalation.manager': 'eventTypes.supportEscalationManager',
  'tasks.review.requested': 'eventTypes.tasksReviewRequested',
} as const;

export type NotificationEventTypeMessageKey =
  (typeof NOTIFICATION_EVENT_TYPE_MESSAGE_KEYS)[keyof typeof NOTIFICATION_EVENT_TYPE_MESSAGE_KEYS];

/** Last segment of `module.event_name` → "Event name". */
export function humanizeNotificationEventType(eventType: string): string {
  const last = eventType.split('.').pop() ?? eventType;
  const spaced = last.replace(/_/g, ' ').trim();
  if (!spaced) return eventType;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function resolveNotificationEventTypeMessageKey(
  eventType: string,
): NotificationEventTypeMessageKey | null {
  return (
    NOTIFICATION_EVENT_TYPE_MESSAGE_KEYS[
      eventType as keyof typeof NOTIFICATION_EVENT_TYPE_MESSAGE_KEYS
    ] ?? null
  );
}
