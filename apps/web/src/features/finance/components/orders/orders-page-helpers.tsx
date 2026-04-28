import Link from 'next/link';
import { X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  ORDER_RECONCILIATION_GAP,
  type OrderReconciliationGap,
  parseOrderReconciliationGap,
} from '@/features/finance/constants/order-reconciliation-drilldown';
import type { ListData } from '@/lib/api/finance-common';
import type { Order } from '@/lib/api/finance';
import { cn } from '@/lib/utils';

export function ReconciliationGapBanner({
  gap,
  onClear,
}: {
  gap: OrderReconciliationGap;
  onClear: () => void;
}) {
  const label =
    gap === ORDER_RECONCILIATION_GAP.UNINVOICED
      ? 'Server-filtered list: orders that still have uninvoiced amounts.'
      : 'Server-filtered list: orders that still have outstanding payment amounts.';

  return (
    <div className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
      <p className="text-foreground max-w-prose">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/finance/dashboard"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Back to Finance dashboard
        </Link>
        <Button variant="outline" size="sm" onClick={onClear}>
          <X size={14} className="mr-1" />
          Clear filter
        </Button>
      </div>
    </div>
  );
}

export function buildOrdersDescription(
  pageCount: number,
  meta: ListData<Order>['meta'] | null,
  gap: ReturnType<typeof parseOrderReconciliationGap>,
): string {
  if (!gap) {
    return `${pageCount} orders`;
  }
  const total = meta?.total ?? pageCount;
  return `${pageCount} on this page · ${total} matching filter`;
}
