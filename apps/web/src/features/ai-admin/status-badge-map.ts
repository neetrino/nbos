import type { StatusVariant } from '@/components/shared';

export function agentStateVariant(state: string): StatusVariant {
  if (state === 'ACTIVE') return 'emerald';
  if (state === 'DISABLED' || state === 'PAUSED') return 'amber';
  if (state === 'REVOKED' || state === 'ARCHIVED') return 'red';
  if (state === 'EXPIRED' || state === 'UNAVAILABLE') return 'orange';
  if (state === 'DISCOVERED' || state === 'DRAFT') return 'blue';
  return 'gray';
}
