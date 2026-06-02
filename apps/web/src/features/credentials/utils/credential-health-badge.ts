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
