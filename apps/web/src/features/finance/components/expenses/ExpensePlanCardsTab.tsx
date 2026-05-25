'use client';

import Link from 'next/link';
import { ExternalLink, Receipt } from 'lucide-react';
import { DetailSheetSection } from '@/components/shared';
import { planExpensesDrilldownHref } from '@/features/finance/constants/project-expenses-drilldown';
import type { ExpensePlan } from '@/lib/api/expense-plans';

export function ExpensePlanCardsTab({ plan }: { plan: ExpensePlan }) {
  return (
    <DetailSheetSection title="Expense cards" icon={<Receipt size={12} />}>
      <p className="text-muted-foreground text-sm">
        Cards generated from this plan appear on the pay now board. Open the filtered list to review
        or pay them.
      </p>
      <Link
        href={planExpensesDrilldownHref(plan.id)}
        className="text-primary mt-3 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
      >
        View {plan._count.expenses} card{plan._count.expenses === 1 ? '' : 's'} on pay now
        <ExternalLink size={12} className="opacity-70" aria-hidden />
      </Link>
    </DetailSheetSection>
  );
}
