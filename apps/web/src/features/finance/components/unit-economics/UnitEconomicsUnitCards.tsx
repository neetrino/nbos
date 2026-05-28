'use client';

import { PieChart } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import type { UnitEconomicsDrilldownFocus, UnitEconomicsRow } from '@/lib/api/unit-economics';
import { cn } from '@/lib/utils';

type DrilldownHandler = (orderId: string, focus: UnitEconomicsDrilldownFocus) => void;

function marginClass(value: number): string {
  if (value < 0) return 'text-destructive';
  if (value > 0) return 'text-emerald-600 dark:text-emerald-400';
  return 'text-muted-foreground';
}

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
      <div className="flex flex-col gap-0.5">
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
      <span className="text-sm font-medium tabular-nums">{formatted}</span>
    </button>
  );
}

function UnitEconomicsUnitCard({
  row,
  onDrilldown,
}: {
  row: UnitEconomicsRow;
  onDrilldown?: DrilldownHandler;
}) {
  const cash = Number.parseFloat(row.cashBalance);
  const margin = Number.parseFloat(row.marginAfterCommitments);

  return (
    <article className="border-border bg-card flex flex-col gap-4 rounded-xl border p-4 shadow-sm">
      <header className="flex flex-col gap-1">
        <button
          type="button"
          className="hover:text-primary text-left text-sm font-semibold"
          onClick={() => onDrilldown?.(row.orderId, 'invoices')}
        >
          {row.label}
        </button>
        <p className="text-muted-foreground text-[11px]">
          {row.orderCode} · {row.projectCode}
          {row.deliveryOpen ? ' · open' : ' · closed'}
        </p>
      </header>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <MetricButton
          label="Received"
          amount={Number.parseFloat(row.receivedAmount)}
          orderId={row.orderId}
          focus="payments"
          onDrilldown={onDrilldown}
        />
        <MetricButton
          label="To receive"
          amount={Number.parseFloat(row.receivableAmount)}
          orderId={row.orderId}
          focus="invoices"
          onDrilldown={onDrilldown}
        />
        <MetricButton
          label="Spent"
          amount={Number.parseFloat(row.outFactAmount)}
          orderId={row.orderId}
          focus="expenses"
          onDrilldown={onDrilldown}
        />
        <MetricButton
          label="Bonus to pay"
          amount={Number.parseFloat(row.remainingBonuses)}
          orderId={row.orderId}
          focus="bonuses"
          onDrilldown={onDrilldown}
        />
        <div className="flex flex-col gap-0.5 px-2 py-1.5">
          <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
            Cash
          </span>
          <span className={cn('text-sm font-semibold tabular-nums', marginClass(cash))}>
            {formatAmount(cash)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 px-2 py-1.5">
          <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
            Margin
          </span>
          <span className={cn('text-sm font-semibold tabular-nums', marginClass(margin))}>
            {formatAmount(margin)}
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
