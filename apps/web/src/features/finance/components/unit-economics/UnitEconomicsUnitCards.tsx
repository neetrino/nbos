'use client';

import { PieChart } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  parseUnitEconomicsMoney,
  parseUnitEconomicsSpent,
  unitEconomicsMarginClass,
} from '@/features/finance/components/unit-economics/unit-economics-money';
import type { UnitEconomicsDrilldownFocus, UnitEconomicsRow } from '@/lib/api/unit-economics';
import { cn } from '@/lib/utils';

type DrilldownHandler = (orderId: string, focus: UnitEconomicsDrilldownFocus) => void;

function MetricButton({
  label,
  amount,
  orderId,
  focus,
  onDrilldown,
}: {
  label: string;
  amount: number;
  orderId: string;
  focus: UnitEconomicsDrilldownFocus;
  onDrilldown?: DrilldownHandler;
}) {
  const formatted = formatAmount(amount);
  if (!onDrilldown) {
    return (
      <div className="flex flex-col gap-0.5 px-2 py-1.5">
        <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
          {label}
        </span>
        <span className="text-sm font-medium tabular-nums">{formatted}</span>
      </div>
    );
  }
  return (
    <button
      type="button"
      className="hover:bg-muted/60 flex flex-col gap-0.5 rounded-lg px-2 py-1.5 text-left transition-colors"
      onClick={() => onDrilldown(orderId, focus)}
    >
      <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
        {label}
      </span>
      <span
        className={cn('text-sm font-medium tabular-nums', amount === 0 && 'text-muted-foreground')}
      >
        {formatted}
      </span>
    </button>
  );
}

function DeliveryStatusBadge({ open }: { open: boolean }) {
  return (
    <span
      className={cn(
        'rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase',
        open
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {open ? 'Open' : 'Closed'}
    </span>
  );
}

function UnitEconomicsUnitCard({
  row,
  onDrilldown,
}: {
  row: UnitEconomicsRow;
  onDrilldown?: DrilldownHandler;
}) {
  const cash = parseUnitEconomicsMoney(row.cashBalance);
  const margin = parseUnitEconomicsMoney(row.marginAfterCommitments);
  const negativeMargin = margin < 0;

  return (
    <article
      className={cn(
        'border-border bg-card flex flex-col gap-4 rounded-xl border p-4 shadow-sm',
        negativeMargin && 'border-destructive/30',
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            className="hover:text-primary line-clamp-2 text-left text-sm font-semibold"
            onClick={() => onDrilldown?.(row.orderId, 'invoices')}
          >
            {row.label}
          </button>
          <p className="text-muted-foreground mt-1 text-[11px]">
            {row.orderCode} · {row.projectCode}
          </p>
        </div>
        <DeliveryStatusBadge open={row.deliveryOpen} />
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="border-border bg-muted/20 col-span-2 grid grid-cols-2 gap-3 rounded-lg border p-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
              Cash
            </span>
            <span
              className={cn('text-lg font-semibold tabular-nums', unitEconomicsMarginClass(cash))}
            >
              {formatAmount(cash)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
              Margin
            </span>
            <span
              className={cn('text-lg font-semibold tabular-nums', unitEconomicsMarginClass(margin))}
            >
              {formatAmount(margin)}
            </span>
          </div>
        </div>

        <MetricButton
          label="Received"
          amount={parseUnitEconomicsMoney(row.receivedAmount)}
          orderId={row.orderId}
          focus="payments"
          onDrilldown={onDrilldown}
        />
        <MetricButton
          label="To receive"
          amount={parseUnitEconomicsMoney(row.receivableAmount)}
          orderId={row.orderId}
          focus="invoices"
          onDrilldown={onDrilldown}
        />
        <MetricButton
          label="Spent"
          amount={parseUnitEconomicsSpent(row)}
          orderId={row.orderId}
          focus="expenses"
          onDrilldown={onDrilldown}
        />
        <MetricButton
          label="Bonus to pay"
          amount={parseUnitEconomicsMoney(row.remainingBonuses)}
          orderId={row.orderId}
          focus="bonuses"
          onDrilldown={onDrilldown}
        />
        <div className="col-span-2 flex flex-col gap-0.5 px-2 py-1.5">
          <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
            Out committed
          </span>
          <span className="text-sm font-medium tabular-nums">
            {formatAmount(parseUnitEconomicsMoney(row.outCommittedAmount))}
          </span>
        </div>
      </div>
    </article>
  );
}

export function UnitEconomicsUnitCards({
  items,
  onDrilldown,
}: {
  items: UnitEconomicsRow[];
  onDrilldown?: DrilldownHandler;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={PieChart}
        title="No matching delivery units"
        description="Adjust search or filters, or wait for financial activity on delivery units."
        action={null}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((row) => (
        <UnitEconomicsUnitCard key={row.orderId} row={row} onDrilldown={onDrilldown} />
      ))}
    </div>
  );
}
