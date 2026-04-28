'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorState, LoadingState } from '@/components/shared';
import { expensePlanDetailPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { CreateExpensePlanDialog } from '@/features/finance/components/expenses/CreateExpensePlanDialog';
import { ExpensePlanDetailBody } from '@/features/finance/components/expenses/ExpensePlanDetailBody';
import { ExpensePlanDetailHeader } from '@/features/finance/components/expenses/ExpensePlanDetailHeader';
import { GenerateExpenseCardFromPlanDialog } from '@/features/finance/components/expenses/GenerateExpenseCardFromPlanDialog';
import { useExpensePlanDetail } from '@/features/finance/hooks/use-expense-plan-detail';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { expensePlansApi } from '@/lib/api/expense-plans';
import { getApiErrorMessage } from '@/lib/api-errors';

export default function ExpensePlanDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const { plan, loading, error, fetchPlan } = useExpensePlanDetail(id);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

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

  const handleDeletePlan = () => {
    if (!plan) return;
    if (
      !window.confirm(
        `Delete expense plan “${plan.name}”? Linked cards keep running; plan link is cleared.`,
      )
    ) {
      return;
    }
    void (async () => {
      try {
        await expensePlansApi.delete(plan.id);
        toast.success('Expense plan deleted.');
        router.push('/finance/expenses/plans');
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Could not delete expense plan.'));
      }
    })();
  };

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
        onEditClick={() => setEditOpen(true)}
        onDeleteClick={handleDeletePlan}
      />
      <ExpensePlanDetailBody plan={plan} />
      <CreateExpensePlanDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        planToEdit={plan}
        onUpdated={() => {
          void fetchPlan();
        }}
      />
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
