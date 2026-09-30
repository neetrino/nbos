'use client';

import { CreateExpenseDialog } from '@/features/finance/components/expenses/CreateExpenseDialog';
import { GenerateExpenseCardFromPlanDialog } from '@/features/finance/components/expenses/GenerateExpenseCardFromPlanDialog';
import type { ExpensePlan } from '@/lib/api/expense-plans';

interface ExpensePlanDetailSheetDialogsProps {
  plan: ExpensePlan | null;
  generateOpen: boolean;
  createOpen: boolean;
  onGenerateOpenChange: (open: boolean) => void;
  onCreateOpenChange: (open: boolean) => void;
  onCardsChanged: () => void;
}

export function ExpensePlanDetailSheetDialogs({
  plan,
  generateOpen,
  createOpen,
  onGenerateOpenChange,
  onCreateOpenChange,
  onCardsChanged,
}: ExpensePlanDetailSheetDialogsProps) {
  if (!plan) return null;

  return (
    <>
      <GenerateExpenseCardFromPlanDialog
        plan={plan}
        open={generateOpen}
        onOpenChange={onGenerateOpenChange}
        onGenerated={onCardsChanged}
      />
      <CreateExpenseDialog
        open={createOpen}
        onOpenChange={onCreateOpenChange}
        lockedExpensePlan={plan}
        forceNestedBackdrop
        onCreated={onCardsChanged}
      />
    </>
  );
}
