'use client';

import Link from 'next/link';
import { ArrowLeft, FileOutput, Pencil, RefreshCcw, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ExpensePlan } from '@/lib/api/expense-plans';

export interface ExpensePlanDetailHeaderProps {
  plan: ExpensePlan;
  onRefresh: () => void;
  onGenerateClick: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

export function ExpensePlanDetailHeader({
  plan,
  onRefresh,
  onGenerateClick,
  onEditClick,
  onDeleteClick,
}: ExpensePlanDetailHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <Link
          href="/finance/expenses/plans"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'text-muted-foreground mb-2 -ml-2 inline-flex h-auto items-center gap-1 px-2 py-1',
          )}
        >
          <ArrowLeft size={14} />
          Expense plans
        </Link>
        <h1 className="text-foreground text-2xl font-semibold">{plan.name}</h1>
        <p className="text-muted-foreground mt-1 font-mono text-xs">{plan.id}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="icon" onClick={() => void onRefresh()}>
          <RefreshCcw size={16} />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onEditClick}>
          <Pencil size={16} />
          Edit plan
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDeleteClick}>
          <Trash2 size={16} />
          Delete
        </Button>
        <Button type="button" onClick={onGenerateClick}>
          <FileOutput size={16} />
          Generate expense card
        </Button>
      </div>
    </div>
  );
}
