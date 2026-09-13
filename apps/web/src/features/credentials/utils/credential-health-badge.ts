import type { StatusVariant } from '@/components/shared/StatusBadge';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';

export type CredentialHealthBadgeStatus = 'OVERDUE' | 'DUE_SOON' | 'HEALTHY' | 'UNKNOWN';

export const CREDENTIAL_HEALTH_STATUS_KEYS = {
  OVERDUE: 'table.overdue',
  DUE_SOON: 'table.dueSoon',
  HEALTHY: 'table.healthy',
  UNKNOWN: 'table.unknown',
} as const;

export function credentialHealthBadge(
  health?: CredentialListItem['health'],
): { status: CredentialHealthBadgeStatus; variant: StatusVariant } | null {
  if (!health) return null;
  if (health.status === 'OVERDUE') return { status: 'OVERDUE', variant: 'red' };
  if (health.status === 'DUE_SOON') return { status: 'DUE_SOON', variant: 'amber' };
  if (health.status === 'HEALTHY') return { status: 'HEALTHY', variant: 'green' };
  return { status: 'UNKNOWN', variant: 'default' };
}

/** Compact rotation hint for list view — only when due soon or overdue. */
export function credentialRotationListHint(
  health?: CredentialListItem['health'],
): { status: 'OVERDUE' | 'DUE_SOON'; days: number | null; variant: StatusVariant } | null {
  if (!health) return null;
  if (health.status === 'OVERDUE') {
    const overdueDays =
      health.dueInDays !== null && health.dueInDays < 0 ? Math.abs(health.dueInDays) : null;
    return { status: 'OVERDUE', days: overdueDays, variant: 'red' };
  }
  if (health.status === 'DUE_SOON') {
    return { status: 'DUE_SOON', days: health.dueInDays, variant: 'amber' };
  }
  return null;
}
