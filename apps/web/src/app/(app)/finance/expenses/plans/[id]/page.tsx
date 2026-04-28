'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ErrorState, LoadingState } from '@/components/shared';
import { expensePlanDetailPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { ExpensePlanDetailBody } from '@/features/finance/components/expenses/ExpensePlanDetailBody';
import { ExpensePlanDetailHeader } from '@/features/finance/components/expenses/ExpensePlanDetailHeader';
import { GenerateExpenseCardFromPlanDialog } from '@/features/finance/components/expenses/GenerateExpenseCardFromPlanDialog';
import { useExpensePlanDetail } from '@/features/finance/hooks/use-expense-plan-detail';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';

export default function ExpensePlanDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const { plan, loading, error, fetchPlan } = useExpensePlanDetail(id);
  const [generateOpen, setGenerateOpen] = useState(false);

  const docTitle = useMemo(
    () =>
      expensePlanDetailPageTitle({
        loading,
        loadFailed: Boolean(error || !plan),
        planName: plan?.name,
      }),
    [loading, error, plan],
  );

  useFinanceDocumentTitle(docTitle);

  if (!id) {
    return <ErrorState description="Invalid plan." />;
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <LoadingState count={3} />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          href="/finance/expenses/plans"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft size={14} />
          Back to expense plans
        </Link>
        <ErrorState description={error ?? 'Not found'} onRetry={() => void fetchPlan()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ExpensePlanDetailHeader
        plan={plan}
        onRefresh={fetchPlan}
        onGenerateClick={() => setGenerateOpen(true)}
      />
      <ExpensePlanDetailBody plan={plan} />
      <GenerateExpenseCardFromPlanDialog
        plan={plan}
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onGenerated={() => {
          void fetchPlan();
        }}
      />
    </div>
  );
}
