'use client';

import type { KeyboardEvent, ReactNode } from 'react';
import { AlertTriangle, Building2, CheckCircle2, FolderKanban } from 'lucide-react';
import { KanbanCardShell, StatusBadge } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import { getOrderDisplayTitle } from '@/features/finance/utils/order-display';
import type { Order } from '@/lib/api/finance';
import { cn } from '@/lib/utils';
import { getOrderCoveragePercents, getOrderTotalAmount } from './order-display-utils';

const COVERAGE_FULL_PERCENT = 100;

interface OrderBoardCardProps {
  order: Order;
  onOrderClick: (order: Order) => void;
}

export function OrderBoardCard({ order, onOrderClick }: OrderBoardCardProps) {
  const title = getOrderDisplayTitle(order);
  const total = getOrderTotalAmount(order);
  const percents = getOrderCoveragePercents(order);
  const warnings = order.reconciliation?.warnings ?? [];
  const typeLabel = order.type.replace(/_/g, ' ').toUpperCase();
  const showCodeSubline = title !== order.code;

  return (
    <KanbanCardShell as="article" radius="xl" padding="none" baseShadow="sm" hoverShadow="md">
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'cursor-pointer space-y-3 rounded-xl p-4',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        )}
        onClick={() => onOrderClick(order)}
        onKeyDown={(event) => handleCardKeyDown(event, order, onOrderClick)}
      >
        <div className="flex items-stretch gap-2.5">
          <span
            className={cn(
              'w-1 shrink-0 rounded-full bg-sky-400',
              showCodeSubline ? 'min-h-8' : 'h-3.5 self-center',
            )}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-foreground truncate text-sm leading-none font-bold">{title}</p>
              <StatusBadge
                label={typeLabel}
                variant="blue"
                className="shrink-0 rounded-full px-2.5 text-[10px] font-semibold tracking-wide"
              />
            </div>
            {showCodeSubline ? (
              <p className="text-muted-foreground mt-0.5 truncate text-xs">{order.code}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-foreground text-xl leading-none font-bold tabular-nums">
            {formatAmount(total, order.currency)}
          </p>
          {percents ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <CoveragePill label="Inv" percent={percents.invoicedPercent} tone="green" />
              <CoveragePill label="Paid" percent={percents.paidPercent} tone="blue" />
              {warnings.length > 0 ? (
                <AlertTriangle size={12} className="text-amber-600" aria-hidden />
              ) : null}
            </div>
          ) : null}
        </div>

        {order.company || order.project ? (
          <div className="border-border flex flex-col gap-2.5 border-t pt-3">
            {order.company ? (
              <MetaRow
                icon={<Building2 size={14} aria-hidden />}
                iconClassName="bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400"
                label={order.company.name}
              />
            ) : null}
            {order.project ? (
              <MetaRow
                icon={<FolderKanban size={14} aria-hidden />}
                iconClassName="bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
                label={order.project.name}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </KanbanCardShell>
  );
}

const COVERAGE_TONE_CLASS = {
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  blue: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
} as const;

function CoveragePill({
  label,
  percent,
  tone,
}: {
  label: string;
  percent: number;
  tone: keyof typeof COVERAGE_TONE_CLASS;
}) {
  const isComplete = percent >= COVERAGE_FULL_PERCENT;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums',
        COVERAGE_TONE_CLASS[tone],
      )}
    >
      {isComplete ? <CheckCircle2 size={11} className="shrink-0" aria-hidden /> : null}
      {label} {percent}%
    </span>
  );
}

function MetaRow({
  icon,
  iconClassName,
  label,
}: {
  icon: ReactNode;
  iconClassName: string;
  label: string;
}) {
  return (
    <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-x-2.5">
      <span
        className={cn(
          'flex size-7 items-center justify-center justify-self-start rounded-lg',
          iconClassName,
        )}
      >
        {icon}
      </span>
      <p className="text-foreground/80 truncate text-xs">{label}</p>
    </div>
  );
}

function handleCardKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
  order: Order,
  onOrderClick: (order: Order) => void,
): void {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onOrderClick(order);
}
