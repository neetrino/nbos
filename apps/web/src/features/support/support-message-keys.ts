import type enSupport from '@/messages/en/support.json';
import type { MessageLeafKeys } from '@/i18n/message-leaf-keys';
import type { AuditLogEntry } from '@/lib/api/audit';
import {
  SUPPORT_TICKET_CLOSE_REASON_OPTIONS,
  TICKET_CATEGORIES,
  TICKET_COVERAGE_DECISIONS,
  TICKET_PRIORITIES,
  TICKET_SLA_STATES,
  TICKET_STATUSES,
  TICKET_WAITING_STATES,
} from '@/features/support/constants/support';

export type SupportMessageKey = MessageLeafKeys<typeof enSupport>;

export type SupportTranslator = (
  key: SupportMessageKey,
  values?: Record<string, string | number | Date>,
) => string;

type CategoryValue = (typeof TICKET_CATEGORIES)[number]['value'];
type PriorityValue = (typeof TICKET_PRIORITIES)[number]['value'];
type StatusValue = (typeof TICKET_STATUSES)[number]['value'];
type CoverageValue = (typeof TICKET_COVERAGE_DECISIONS)[number]['value'];
type SlaValue = (typeof TICKET_SLA_STATES)[number]['value'];
type WaitingValue = (typeof TICKET_WAITING_STATES)[number]['value'];
type CloseReasonValue = (typeof SUPPORT_TICKET_CLOSE_REASON_OPTIONS)[number]['value'];

export const SUPPORT_CATEGORY_MESSAGE_KEYS = {
  UNCLASSIFIED: 'category.UNCLASSIFIED',
  INCIDENT: 'category.INCIDENT',
  SERVICE_REQUEST: 'category.SERVICE_REQUEST',
  CHANGE_REQUEST: 'category.CHANGE_REQUEST',
  PROBLEM: 'category.PROBLEM',
} as const satisfies Record<CategoryValue, SupportMessageKey>;

export const SUPPORT_PRIORITY_MESSAGE_KEYS = {
  P1: 'priority.P1',
  P2: 'priority.P2',
  P3: 'priority.P3',
} as const satisfies Record<PriorityValue, SupportMessageKey>;

export const SUPPORT_STATUS_MESSAGE_KEYS = {
  NEW: 'status.NEW',
  TRIAGED: 'status.TRIAGED',
  ASSIGNED: 'status.ASSIGNED',
  IN_PROGRESS: 'status.IN_PROGRESS',
  RESOLVED: 'status.RESOLVED',
  CLOSED: 'status.CLOSED',
} as const satisfies Record<StatusValue, SupportMessageKey>;

export const SUPPORT_COVERAGE_MESSAGE_KEYS = {
  COVERED_BY_MAINTENANCE: 'coverage.COVERED_BY_MAINTENANCE',
  FREE_GOODWILL: 'coverage.FREE_GOODWILL',
  BILLABLE_SMALL_WORK: 'coverage.BILLABLE_SMALL_WORK',
  EXTENSION_REQUIRED: 'coverage.EXTENSION_REQUIRED',
  NOT_COVERED_REJECTED: 'coverage.NOT_COVERED_REJECTED',
} as const satisfies Record<CoverageValue, SupportMessageKey>;

export const SUPPORT_SLA_MESSAGE_KEYS = {
  ON_TRACK: 'sla.ON_TRACK',
  AT_RISK: 'sla.AT_RISK',
  HIGH_RISK: 'sla.HIGH_RISK',
  BREACHED: 'sla.BREACHED',
  PAUSED: 'sla.PAUSED',
  CLOSED: 'sla.CLOSED',
} as const satisfies Record<SlaValue, SupportMessageKey>;

export const SUPPORT_WAITING_MESSAGE_KEYS = {
  all: 'waiting.all',
  NONE: 'waiting.NONE',
  WAITING_FOR_CLIENT: 'waiting.WAITING_FOR_CLIENT',
  WAITING_FOR_THIRD_PARTY: 'waiting.WAITING_FOR_THIRD_PARTY',
  ESCALATED: 'waiting.ESCALATED',
} as const satisfies Record<WaitingValue, SupportMessageKey>;

export const SUPPORT_CLOSE_REASON_MESSAGE_KEYS = {
  CLIENT_CONFIRMED: 'closeReason.CLIENT_CONFIRMED',
  MANUAL: 'closeReason.MANUAL',
  DUPLICATE: 'closeReason.DUPLICATE',
  AUTO_TIMED_OUT: 'closeReason.AUTO_TIMED_OUT',
  EXTENSION_DELIVERED: 'closeReason.EXTENSION_DELIVERED',
} as const satisfies Record<CloseReasonValue | 'EXTENSION_DELIVERED', SupportMessageKey>;

export const SUPPORT_AUDIT_ACTION_MESSAGE_KEYS = {
  'support.status_changed': 'audit.actions.statusChanged',
  'support.closed_extension_delivered': 'audit.actions.closedExtensionDelivered',
  'support.reopened': 'audit.actions.reopened',
  'support.waiting_changed': 'audit.actions.waitingChanged',
  'support.escalation_manager': 'audit.actions.escalationManager',
} as const satisfies Record<string, SupportMessageKey>;

function translateMappedLabel(
  translate: SupportTranslator,
  keys: Record<string, SupportMessageKey>,
  value: string,
  fallback: string,
): string {
  const key = keys[value];
  return key ? translate(key) : fallback;
}

export function translateSupportCategory(
  translate: SupportTranslator,
  value: string,
  fallback: string,
): string {
  return translateMappedLabel(translate, SUPPORT_CATEGORY_MESSAGE_KEYS, value, fallback);
}

export function translateSupportPriority(
  translate: SupportTranslator,
  value: string,
  fallback: string,
): string {
  return translateMappedLabel(translate, SUPPORT_PRIORITY_MESSAGE_KEYS, value, fallback);
}

export function translateSupportStatus(
  translate: SupportTranslator,
  value: string,
  fallback: string,
): string {
  return translateMappedLabel(translate, SUPPORT_STATUS_MESSAGE_KEYS, value, fallback);
}

export function translateSupportCoverage(
  translate: SupportTranslator,
  value: string,
  fallback: string,
): string {
  return translateMappedLabel(translate, SUPPORT_COVERAGE_MESSAGE_KEYS, value, fallback);
}

export function translateSupportSla(
  translate: SupportTranslator,
  value: string,
  fallback: string,
): string {
  return translateMappedLabel(translate, SUPPORT_SLA_MESSAGE_KEYS, value, fallback);
}

export function translateSupportWaiting(
  translate: SupportTranslator,
  value: string,
  fallback: string,
): string {
  return translateMappedLabel(translate, SUPPORT_WAITING_MESSAGE_KEYS, value, fallback);
}

export function translateSupportCloseReason(
  translate: SupportTranslator,
  value: string,
  fallback: string,
): string {
  return translateMappedLabel(translate, SUPPORT_CLOSE_REASON_MESSAGE_KEYS, value, fallback);
}

function translateSupportAuditValue(
  translate: SupportTranslator,
  action: string,
  value: string,
): string {
  if (action === 'support.waiting_changed') {
    return translateSupportWaiting(translate, value, value);
  }
  if (
    action === 'support.status_changed' ||
    action === 'support.closed_extension_delivered' ||
    action === 'support.reopened'
  ) {
    return translateSupportStatus(translate, value, value);
  }
  return value;
}

export function formatSupportAuditLine(entry: AuditLogEntry, translate: SupportTranslator): string {
  const actionLabel = translateMappedLabel(
    translate,
    SUPPORT_AUDIT_ACTION_MESSAGE_KEYS,
    entry.action,
    entry.action,
  );
  const changes = entry.changes;
  if (!isRecord(changes) || typeof changes.from !== 'string' || typeof changes.to !== 'string') {
    return actionLabel;
  }
  return translate('audit.change', {
    action: actionLabel,
    from: translateSupportAuditValue(translate, entry.action, changes.from),
    to: translateSupportAuditValue(translate, entry.action, changes.to),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
