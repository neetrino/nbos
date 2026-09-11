'use client';

import { KanbanCardShell, StatusBadge } from '@/components/shared';
import { formatAmountAbbreviated, getSubscriptionStatus } from '@/features/finance/constants/finance';
import {
  formatSubscriptionGridRowMeta,
  getSubscriptionDisplayTitle,
} from '@/features/finance/utils/subscription-display';
import type { Subscription, SubscriptionGridRow } from '@/lib/api/finance';
import type { SubscriptionCalendarMonthLabel } from './subscription-coverage-grid-types';
import { SubscriptionCoverageMobileMonthGrid } from './SubscriptionCoverageMobileMonthGrid';

interface SubscriptionCoverageMobileCardProps {
  row: SubscriptionGridRow;
  subscription: Subscription | undefined;
  months: SubscriptionCalendarMonthLabel[];
  currentMonthIndex: number | null;
  onOpenSubscription: (subscriptionId: string) => void;
  onOpenMonthCell: (args: { subscriptionId: string; invoiceId: string | null }) => void;
}

export function SubscriptionCoverageMobileCard({
  row,
  subscription,
  months,
  currentMonthIndex,
  onOpenSubscription,
  onOpenMonthCell,
}: SubscriptionCoverageMobileCardProps) {
  return (
    <KanbanCardShell as="article" radius="xl" padding="none" baseShadow="sm" hoverShadow="md">
      <div className="space-y-3 p-4">
        <SubscriptionCoverageMobileCardHeader
          row={row}
          subscription={subscription}
          onOpen={() => onOpenSubscription(row.subscriptionId)}
        />
        <SubscriptionCoverageMobileMonthGrid
          months={months}
          cells={row.months}
          currentMonthIndex={currentMonthIndex}
          onOpenMonth={(_monthIndex, invoiceId) =>
            onOpenMonthCell({ subscriptionId: row.subscriptionId, invoiceId })
          }
        />
      </div>
    </KanbanCardShell>
  );
}

function SubscriptionCoverageMobileCardHeader({
  row,
  subscription,
  onOpen,
}: {
  row: SubscriptionGridRow;
  subscription: Subscription | undefined;
  onOpen: () => void;
}) {
  const statusMeta = getSubscriptionStatus(subscription?.status ?? row.subscriptionStatus);
  const title = getSubscriptionDisplayTitle({
    name: row.subscriptionName,
    code: subscription?.code ?? row.subscriptionName,
  });
  const meta = subscription ? formatSubscriptionGridRowMeta(subscription) : null;

  return (
    <button
      type="button"
      className="flex w-full min-w-0 items-start justify-between gap-3 text-left"
      onClick={onOpen}
    >
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-bold">{title}</p>
        {meta ? (
          <p className="text-muted-foreground mt-0.5 truncate text-xs" title={meta.title}>
            {meta.text}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {statusMeta ? <StatusBadge label={statusMeta.label} variant={statusMeta.variant} /> : null}
        <span className="text-foreground text-sm font-bold tabular-nums">
          {formatAmountAbbreviated(row.annualTotal)}
        </span>
      </div>
    </button>
  );
}
