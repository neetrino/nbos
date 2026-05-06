export interface NotificationRuleConfig {
  eventType: string;
  category: string;
  priority: string;
}

export const NOTIFICATION_RULE_CONFIGS: NotificationRuleConfig[] = [
  { eventType: 'finance.wallet.bonus_active', category: 'informational', priority: 'normal' },
  { eventType: 'finance.wallet.bonus_paid', category: 'informational', priority: 'normal' },
  { eventType: 'finance.wallet.bonus_corrected', category: 'informational', priority: 'normal' },
  { eventType: 'finance.wallet.payroll_created', category: 'informational', priority: 'normal' },
  { eventType: 'finance.wallet.payroll_closed', category: 'informational', priority: 'normal' },
  { eventType: 'finance.wallet.salary_payment', category: 'informational', priority: 'normal' },
  {
    eventType: 'finance.invoice.official_request_due',
    category: 'action_required',
    priority: 'high',
  },
  {
    eventType: 'finance.invoice.payment_reminder_due',
    category: 'action_required',
    priority: 'high',
  },
  {
    eventType: 'finance.expense.backlog_weekly_digest',
    category: 'informational',
    priority: 'normal',
  },
  {
    eventType: 'finance.expense.backlog_due_overdue',
    category: 'action_required',
    priority: 'high',
  },
  { eventType: 'task.overdue', category: 'action_required', priority: 'high' },
  { eventType: 'finance.overdue', category: 'action_required', priority: 'high' },
  { eventType: 'mail.health_degraded', category: 'system_health', priority: 'high' },
  { eventType: 'mail.send_failed', category: 'system_health', priority: 'high' },
  { eventType: 'document.access_changed', category: 'audit_security', priority: 'normal' },
  { eventType: 'credentials.high_risk_action', category: 'audit_security', priority: 'high' },
  { eventType: 'support.sla.resolve_warning', category: 'action_required', priority: 'high' },
  { eventType: 'support.sla.response_breached', category: 'action_required', priority: 'high' },
  { eventType: 'support.sla.resolve_breached', category: 'action_required', priority: 'high' },
  { eventType: 'support.escalation.manager', category: 'action_required', priority: 'high' },
];

const RULE_CONFIG_BY_EVENT = new Map(
  NOTIFICATION_RULE_CONFIGS.map((rule) => [rule.eventType, rule]),
);

export function resolveNotificationRuleConfig(eventType: string): NotificationRuleConfig {
  return (
    RULE_CONFIG_BY_EVENT.get(eventType) ?? {
      eventType,
      category: 'informational',
      priority: 'normal',
    }
  );
}
