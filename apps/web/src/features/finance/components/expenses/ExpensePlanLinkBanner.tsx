'use client';

import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { DetailSheetEntityLinkGrid, DetailSheetSection } from '@/components/shared';
import { ExpensePlanDetailSheet } from '@/features/finance/components/expenses/ExpensePlanDetailSheet';
import { InvoiceLinkedReadonlyField } from '@/features/finance/components/invoices/InvoiceLinkedReadonlyField';

export interface ExpensePlanLinkBannerProps {
  planId: string;
  planName: string;
}

/** Expense plan link, shown in the sheet Linked block. */
export function ExpensePlanLinkBanner({ planId, planName }: ExpensePlanLinkBannerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <DetailSheetSection title="Linked" outlined>
        <DetailSheetEntityLinkGrid className="sm:grid-cols-2">
          <InvoiceLinkedReadonlyField
            label="Plan"
            entityKind="project"
            value={planId}
            selectionLabel={planName}
            icon={<CalendarDays size={12} />}
            onOpen={() => setOpen(true)}
          />
        </DetailSheetEntityLinkGrid>
      </DetailSheetSection>
      <ExpensePlanDetailSheet
        planId={open ? planId : null}
        open={open}
        onOpenChange={setOpen}
        forceNestedBackdrop
      />
    </>
  );
}
