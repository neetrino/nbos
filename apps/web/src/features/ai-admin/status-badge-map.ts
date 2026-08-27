import type { StatusVariant } from '@/components/shared';

export function agentStateVariant(state: string): StatusVariant {
  if (state === 'ACTIVE') return 'emerald';
  if (state === 'DISABLED' || state === 'PAUSED') return 'amber';
  if (state === 'REVOKED' || state === 'ARCHIVED') return 'red';
  if (state === 'EXPIRED' || state === 'UNAVAILABLE') return 'orange';
  if (state === 'DISCOVERED' || state === 'DRAFT') return 'blue';
  return 'gray';
}

export function executionStatusVariant(status: string): StatusVariant {
  if (status === 'SUCCEEDED') return 'emerald';
  if (status === 'FAILED') return 'red';
  if (status === 'RATE_LIMITED') return 'amber';
  if (status === 'STARTED') return 'blue';
  if (status === 'CANCELLED') return 'gray';
  return 'gray';
}
