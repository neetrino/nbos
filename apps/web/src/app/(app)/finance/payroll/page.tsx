'use client';

import { Suspense } from 'react';
import { LoadingState } from '@/components/shared';
import { PayrollRunsListPageContent } from '@/features/finance/components/payroll/PayrollRunsListPageContent';

export default function PayrollRunsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full flex-col gap-5">
          <div className="border-border bg-muted/40 h-9 max-w-md rounded-md border" />
          <LoadingState />
        </div>
      }
    >
      <PayrollRunsListPageContent />
    </Suspense>
  );
}
