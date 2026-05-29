'use client';

import { cn } from '@/lib/utils';

type MetricItem = { label: string; value: string };

const LABEL_CLASS =
  'text-muted-foreground text-left text-[8px] font-bold tracking-wide leading-none';

const VALUE_CLASS = 'text-foreground text-right text-[10px] tabular-nums leading-tight';

export function ExpansionMetricStack({ items }: { items: MetricItem[] }) {
  return (
    <div className="flex w-full flex-col gap-1">
      {items.map((item) => (
        <div key={item.label} className="max-w-full min-w-0">
          <p className={cn(LABEL_CLASS, 'truncate')}>{item.label}</p>
          <p className={cn(VALUE_CLASS, 'mt-0.5 truncate')}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}
