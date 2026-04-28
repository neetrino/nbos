'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, FolderKanban, RefreshCcw } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import { formatAmount, getExpenseStage } from '@/features/finance/constants/finance';
import { cn } from '@/lib/utils';
import { expensesApi, type Expense } from '@/lib/api/finance';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function ExpenseDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpense = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await expensesApi.getById(id);
      setExpense(data);
      setError(null);
    } catch {
      setExpense(null);
      setError('Expense could not be loaded. It may have been removed.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchExpense();
  }, [fetchExpense]);

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-5">
        <LoadingState count={4} />
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="flex h-full flex-col gap-5">
        <div className="flex items-center gap-2">
          <Link
            href="/finance/expenses"
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
            aria-label="Back to expenses"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-foreground text-2xl font-semibold">Expense</h1>
        </div>
        <ErrorState description={error ?? 'Not found'} onRetry={fetchExpense} />
      </div>
    );
  }

  const stage = getExpenseStage(expense.status);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/finance/expenses"
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'mt-0.5 shrink-0')}
            aria-label="Back to expenses"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-foreground text-2xl font-semibold">{expense.name}</h1>
            <p className="text-muted-foreground mt-1 font-mono text-xs">{expense.id}</p>
          </div>
        </div>
        <Button variant="outline" size="icon" type="button" onClick={fetchExpense}>
          <RefreshCcw size={16} />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Amount</p>
          <p className="mt-2 text-lg font-semibold tabular-nums">
            {formatAmount(parseFloat(expense.amount))}
          </p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Status</p>
          <div className="mt-2">
            {stage ? <StatusBadge label={stage.label} variant={stage.variant} /> : expense.status}
          </div>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Type</p>
          <div className="mt-2">
            <StatusBadge
              label={expense.type}
              variant={expense.type === 'PLANNED' ? 'blue' : 'orange'}
            />
          </div>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Category</p>
          <p className="mt-2 font-medium">{expense.category}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Frequency</p>
          <p className="mt-2 font-medium">{expense.frequency}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Due date</p>
          <p className="mt-2 font-medium">{formatDate(expense.dueDate)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Tax status</p>
          <p className="mt-2 font-medium">{expense.taxStatus}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Pass-through</p>
          <p className="mt-2 font-medium">{expense.isPassThrough ? 'Yes' : 'No'}</p>
        </div>
      </div>

      <div className="border-border bg-card rounded-xl border p-4">
        <p className="text-muted-foreground text-xs">Project</p>
        {expense.projectId && expense.project ? (
          <Link
            href={`/projects/${expense.projectId}`}
            className="text-primary mt-2 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
          >
            <FolderKanban size={14} />
            {expense.project.name}
            <ExternalLink size={12} className="opacity-70" aria-hidden />
          </Link>
        ) : (
          <p className="text-muted-foreground mt-2 text-sm">Not linked</p>
        )}
      </div>

      {expense.notes ? (
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Notes</p>
          <p className="text-foreground mt-2 text-sm whitespace-pre-wrap">{expense.notes}</p>
        </div>
      ) : null}

      <p className="text-muted-foreground text-xs">Created {formatDate(expense.createdAt)}</p>
    </div>
  );
}
