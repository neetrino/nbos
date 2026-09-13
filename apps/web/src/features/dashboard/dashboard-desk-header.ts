import type { PriorityCard } from './dashboard-control-registry';
import { DESK_LINE_NEUTRAL_FALLBACK } from './desk-line/desk-line.constants';
import { resolveDeskLineDetails } from './desk-line/desk-line-resolve';
import type { DeskLinePerson, DeskLineResolution } from './desk-line/desk-line.types';

export const DASHBOARD_PRIORITY_CARD_CODES = {
  criticalSupportTicket: 'criticalSupportTicket',
  taskDueToday: 'taskDueToday',
  pendingInvoice: 'pendingInvoice',
} as const;

export type DashboardPriorityCardCode =
  (typeof DASHBOARD_PRIORITY_CARD_CODES)[keyof typeof DASHBOARD_PRIORITY_CARD_CODES];

const PRIORITY_COUNT_PATTERN = /^(\d+)/u;

const API_PRIORITY_CODE_TO_CARD: Record<string, DashboardPriorityCardCode> = {
  critical_tickets: DASHBOARD_PRIORITY_CARD_CODES.criticalSupportTicket,
  tasks_due_today: DASHBOARD_PRIORITY_CARD_CODES.taskDueToday,
  pending_invoices: DASHBOARD_PRIORITY_CARD_CODES.pendingInvoice,
};

export const DASHBOARD_DESK_FALLBACK_GREETING = DESK_LINE_NEUTRAL_FALLBACK.title;
export const DASHBOARD_DESK_FALLBACK_SUBLINE = DESK_LINE_NEUTRAL_FALLBACK.subline;

export function deskCopy(person: DeskLinePerson | null, now?: Date): DeskLineResolution {
  if (!person?.employeeId.trim()) return DESK_LINE_NEUTRAL_FALLBACK;
  return resolveDeskLineDetails(person, now);
}

export function deskHeading(person: DeskLinePerson | null, now?: Date): string {
  return deskCopy(person, now).title;
}

export function deskSubline(person: DeskLinePerson | null, now?: Date): string {
  return deskCopy(person, now).subline;
}

/** Stable card code from API `code`, with source/severity fallback for older payloads. */
export function getPriorityCardCode(priority: PriorityCard): DashboardPriorityCardCode | null {
  const fromApi = priority.code ? API_PRIORITY_CODE_TO_CARD[priority.code] : undefined;
  if (fromApi) {
    return fromApi;
  }
  if (priority.source === 'Support' && priority.severity === 'critical') {
    return DASHBOARD_PRIORITY_CARD_CODES.criticalSupportTicket;
  }
  if (priority.source === 'Tasks' && priority.severity === 'high') {
    return DASHBOARD_PRIORITY_CARD_CODES.taskDueToday;
  }
  if (priority.source === 'Finance' && priority.severity === 'high') {
    return DASHBOARD_PRIORITY_CARD_CODES.pendingInvoice;
  }
  return null;
}

/** Prefer API `count`; fall back to the English title prefix (`3 tasks due today`). */
export function resolvePriorityCardCount(priority: PriorityCard): number {
  if (typeof priority.count === 'number' && Number.isFinite(priority.count)) {
    return Math.max(0, Math.trunc(priority.count));
  }
  return parsePriorityCardCount(priority.title);
}

/** Parse count from the English API title prefix (`3 tasks due today`). */
export function parsePriorityCardCount(title: string): number {
  const match = PRIORITY_COUNT_PATTERN.exec(title);
  if (!match) return 0;
  return Number.parseInt(match[1]!, 10);
}
