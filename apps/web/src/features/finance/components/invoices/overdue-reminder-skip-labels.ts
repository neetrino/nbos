import type { OverdueReminderSkipReason } from '@/lib/api/finance';

const SKIP_LABELS: Record<OverdueReminderSkipReason, string> = {
  not_overdue: 'Not overdue',
  notifications_off: 'Notifications off',
  tax_gate: 'Official invoice request not sent',
  no_whatsapp: 'No Product WhatsApp group',
  same_day: 'Wave 1 already sent today',
  max_wave: 'Both waves already sent',
  no_product_link: 'No subscription or client service',
  already_sent: 'Already sent this wave',
};

export function overdueReminderSkipLabel(reason: OverdueReminderSkipReason): string {
  return SKIP_LABELS[reason];
}

export function countSkippedByReason(
  skipped: Array<{ reason: OverdueReminderSkipReason }>,
): Array<{ reason: OverdueReminderSkipReason; count: number }> {
  const counts = new Map<OverdueReminderSkipReason, number>();
  for (const row of skipped) {
    counts.set(row.reason, (counts.get(row.reason) ?? 0) + 1);
  }
  return [...counts.entries()].map(([reason, count]) => ({ reason, count }));
}
