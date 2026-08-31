import type { WhatsAppOutboundKind } from './whatsapp-outbound.types';

const LEFTOVER_FINANCE_REMINDER_KINDS = new Set<WhatsAppOutboundKind>([
  'payment_reminder',
  'overdue_reminder',
]);

/** Stale Redis kinds. Core persist+core_client_send is the live finance reminder path. */
export function isLeftoverFinanceReminderKind(kind: WhatsAppOutboundKind): boolean {
  return LEFTOVER_FINANCE_REMINDER_KINDS.has(kind);
}
