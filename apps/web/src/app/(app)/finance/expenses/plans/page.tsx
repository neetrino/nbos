'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, FileOutput, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader, EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import { expensePlansListPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { CreateExpensePlanDialog } from '@/features/finance/components/expenses/CreateExpensePlanDialog';
import { GenerateExpenseCardFromPlanDialog } from '@/features/finance/components/expenses/GenerateExpenseCardFromPlanDialog';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { expensePlansApi, type ExpensePlan } from '@/lib/api/expense-plans';
import { getApiErrorMessage } from '@/lib/api-errors';

function formatShortDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function frequencyLabel(value: string): string {
  const map: Record<string, string> = {
    ONE_TIME: 'One-time',
    MONTHLY: 'Monthly',
    QUARTERLY: 'Quarterly',
    YEARLY: 'Yearly',
    MULTI_YEAR: 'Multi-year',
  };
  return map[value] ?? value;
}

export default function ExpensePlansPage() {
  useFinanceDocumentTitle(expensePlansListPageTitle());

  const [plans, setPlans] = useState<ExpensePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generatePlan, setGeneratePlan] = useState<ExpensePlan | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expensePlansApi.getAll({ pageSize: 100 });
      setPlans(res.items);
      setError(null);
    } catch (caught) {
      setError(
        getApiErrorMessage(caught, 'Expense plans could not be loaded. Check your connection.'),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

  const handleDelete = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Delete expense plan “${name}”? Linked cards keep running; plan link is cleared.`,
      )
    ) {
      return;
    }
    try {
      await expensePlansApi.delete(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not delete expense plan.'));
    }
  };

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader
        title="Expense plans"
        description="Recurring or expected outgoing spend (NBOS Expense Plan). Cards and payments stay on the Board."
      >
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void fetchPlans()}>
            <RefreshCcw size={16} className="mr-1" />
            Refresh
          </Button>
          <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={16} className="mr-1" />
            New plan
          </Button>
        </div>
      </PageHeader>

      {loading ? (
        <LoadingState count={3} />
      ) : error ? (
        <ErrorState description={error} onRetry={() => void fetchPlans()} />
      ) : plans.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No expense plans yet"
          description="Create a plan for rent, SaaS, or other recurring spend; generate Board expenses from a plan when due."
        />
      ) : (
        <div className="border-border rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Next due</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Linked cards</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{plan.category}</TableCell>
                  <TableCell>{formatAmount(Number(plan.amount))}</TableCell>
                  <TableCell>{frequencyLabel(plan.frequency)}</TableCell>
                  <TableCell>{formatShortDate(plan.nextDueDate)}</TableCell>
                  <TableCell>{plan.project ? `${plan.project.code}` : '—'}</TableCell>
                  <TableCell className="text-right">{plan._count.expenses}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Generate expense from ${plan.name}`}
                        onClick={() => {
                          setGeneratePlan(plan);
                          setGenerateOpen(true);
                        }}
                      >
                        <FileOutput size={16} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${plan.name}`}
                        onClick={() => void handleDelete(plan.id, plan.name)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateExpensePlanDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          void fetchPlans();
        }}
      />

      <GenerateExpenseCardFromPlanDialog
        plan={generatePlan}
        open={generateOpen}
        onOpenChange={(next) => {
          setGenerateOpen(next);
          if (!next) setGeneratePlan(null);
        }}
        onGenerated={() => void fetchPlans()}
      />
    </div>
  );
}
