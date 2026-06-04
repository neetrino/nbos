import type { StatusVariant } from '@/components/shared/StatusBadge';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';

export function credentialHealthBadge(
  health?: CredentialListItem['health'],
): { label: string; variant: StatusVariant } | null {
  if (!health) return null;
  if (health.status === 'OVERDUE') return { label: 'Overdue', variant: 'red' };
  if (health.status === 'DUE_SOON') return { label: 'Due soon', variant: 'amber' };
  if (health.status === 'HEALTHY') return { label: 'Healthy', variant: 'green' };
  return { label: 'Unknown', variant: 'default' };
}

/** Compact rotation hint for list view — only when due soon or overdue. */
export function credentialRotationListHint(
  health?: CredentialListItem['health'],
): { label: string; variant: StatusVariant } | null {
  if (!health) return null;
  if (health.status === 'OVERDUE') {
    const overdueDays =
      health.dueInDays !== null && health.dueInDays < 0 ? Math.abs(health.dueInDays) : null;
    return {
      label: overdueDays !== null ? `Overdue · ${overdueDays}d` : 'Overdue',
      variant: 'red',
    };
  }
  if (health.status === 'DUE_SOON') {
    const dueDays = health.dueInDays;
    return {
      label: dueDays !== null ? `Due in ${dueDays}d` : 'Due soon',
      variant: 'amber',
    };
  }
  return null;
}
