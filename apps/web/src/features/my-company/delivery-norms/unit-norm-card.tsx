'use client';

import type { ReactNode } from 'react';
import { sumPayableRoleUnits, type DeliveryRoleUnitFinancialDto } from '@nbos/shared';
import { cn } from '@/lib/utils';
import {
  NORMS_UNIT_CARD_CLASS,
  NORMS_UNIT_KIND_CLASS,
  NORMS_UNIT_SUM_CLASS,
} from './delivery-norms.constants';
import { formatUnitSum, UNIT_SUM_EMPTY } from './format-unit-sum';
import { NormativeStatusBadge } from './normative-status-badge';

export function UnitNormCard({
  title,
  kindLabel,
  roleUnits,
  status,
  statusLabel,
  canOpen,
  onOpen,
  publish,
}: {
  title: string;
  kindLabel: string;
  roleUnits: readonly DeliveryRoleUnitFinancialDto[] | null;
  status: string | null;
  statusLabel: string | null;
  canOpen: boolean;
  onOpen: () => void;
  publish?: ReactNode;
}) {
  const total = roleUnits === null ? null : sumPayableRoleUnits(roleUnits);
  return (
    <li className="flex min-w-0 flex-col gap-2">
      <button
        type="button"
        className={cn(NORMS_UNIT_CARD_CLASS, 'w-full', !canOpen && 'cursor-default')}
        disabled={!canOpen}
        onClick={onOpen}
      >
        <span className="flex items-start justify-between gap-3">
          <span
            className={cn(
              NORMS_UNIT_SUM_CLASS,
              total === null ? 'text-muted-foreground' : 'text-foreground',
            )}
          >
            {total === null ? UNIT_SUM_EMPTY : formatUnitSum(total)}
          </span>
          <span className={NORMS_UNIT_KIND_CLASS}>{kindLabel}</span>
        </span>
        <span className="flex items-center justify-between gap-2">
          <span className="text-foreground min-w-0 truncate text-sm font-medium">{title}</span>
          {status && statusLabel ? (
            <NormativeStatusBadge status={status} label={statusLabel} />
          ) : null}
        </span>
      </button>
      {publish}
    </li>
  );
}
