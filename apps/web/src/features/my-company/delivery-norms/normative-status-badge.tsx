'use client';

import type { DeliveryNormativeStatus } from '@nbos/shared';
import { StatusBadge } from '@/components/shared';
import { STATUS_BADGE_VARIANT } from './delivery-norms.constants';

const STATUS_KEYS = {
  DRAFT: 'status.DRAFT',
  PUBLISHED: 'status.PUBLISHED',
  ARCHIVED: 'status.ARCHIVED',
} as const;

export function NormativeStatusBadge({ status, label }: { status: string; label: string }) {
  const variant =
    status in STATUS_BADGE_VARIANT
      ? STATUS_BADGE_VARIANT[status as DeliveryNormativeStatus]
      : 'gray';
  return <StatusBadge label={label} variant={variant} />;
}

export function normativeStatusLabelKey(
  status: string,
): (typeof STATUS_KEYS)[keyof typeof STATUS_KEYS] {
  if (status === 'PUBLISHED' || status === 'ARCHIVED' || status === 'DRAFT') {
    return STATUS_KEYS[status];
  }
  return STATUS_KEYS.DRAFT;
}
