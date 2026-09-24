'use client';

import { useRouter } from 'next/navigation';
import { CalendarDays } from 'lucide-react';
import { DetailSheetEntityLinkGrid, DetailSheetSection } from '@/components/shared';
import { expensePlansListWithOpenPlanHref } from '@/features/finance/constants/expense-plan-deep-link';
import { InvoiceLinkedReadonlyField } from '@/features/finance/components/invoices/InvoiceLinkedReadonlyField';

export interface ExpensePlanLinkBannerProps {
  planId: string;
  planName: string;
}

/** Expense plan link, shown in the sheet Linked block. */
export function ExpensePlanLinkBanner({ planId, planName }: ExpensePlanLinkBannerProps) {
  const router = useRouter();

  return (
    <DetailSheetSection title="Linked" outlined>
      <DetailSheetEntityLinkGrid className="sm:grid-cols-2">
        <InvoiceLinkedReadonlyField
          label="Plan"
          entityKind="project"
          value={planId}
          selectionLabel={planName}
          icon={<CalendarDays size={12} />}
          onOpen={() => router.push(expensePlansListWithOpenPlanHref(planId))}
        />
      </DetailSheetEntityLinkGrid>
    </DetailSheetSection>
  );
}
