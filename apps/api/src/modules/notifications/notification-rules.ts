export interface NotificationRuleConfig {
  eventType: string;
  category: string;
  priority: string;
}

export const NOTIFICATION_RULE_CONFIGS: NotificationRuleConfig[] = [
  { eventType: 'task.overdue', category: 'action_required', priority: 'high' },
  { eventType: 'finance.overdue', category: 'action_required', priority: 'high' },
  { eventType: 'mail.health_degraded', category: 'system_health', priority: 'high' },
  { eventType: 'mail.send_failed', category: 'system_health', priority: 'high' },
  { eventType: 'document.access_changed', category: 'audit_security', priority: 'normal' },
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
