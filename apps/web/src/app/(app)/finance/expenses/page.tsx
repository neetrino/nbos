'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { LoadingState } from '@/components/shared';
import { PROJECT_EXPENSES_DRILLDOWN_QUERY } from '@/features/finance/constants/project-expenses-drilldown';
import { ExpensesPageContent } from '@/features/finance/components/expenses/ExpensesPageContent';

function ExpensesPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get(PROJECT_EXPENSES_DRILLDOWN_QUERY);

  const clearProjectFilter = () => {
    router.replace(pathname ?? '/finance/expenses');
  };

  return (
    <ExpensesPageContent
      projectIdFromUrl={projectIdFromUrl}
      onClearProjectFilter={clearProjectFilter}
    />
  );
}

export default function ExpensesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full flex-col gap-5">
          <LoadingState />
        </div>
      }
    >
      <ExpensesPageInner />
    </Suspense>
  );
}
