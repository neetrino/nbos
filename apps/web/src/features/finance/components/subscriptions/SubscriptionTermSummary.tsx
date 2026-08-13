'use client';

import { CalendarDays } from 'lucide-react';
import { formatSubscriptionTermSummary } from '@/features/finance/utils/subscription-term-display';
import type { Subscription } from '@/lib/api/finance';

/** Read-only fixed-term summary for subscription detail surfaces. */
export function SubscriptionTermSummary({ subscription }: { subscription: Subscription }) {
  const summary = formatSubscriptionTermSummary(subscription);
  if (!summary) return null;

  return (
    <div className="text-sm">
      <div className="text-foreground/85 mb-1.5 flex items-center gap-1.5 font-medium">
        <CalendarDays size={12} className="text-muted-foreground/70" />
        Agreed term
      </div>
      <p className="text-muted-foreground bg-muted/30 border-border rounded-md border px-3 py-2">
        {summary}
      </p>
    </div>
  );
}
