import {
  buildStageGateRequiredFields,
  stageGateFieldClass,
  type SheetStageGateHighlight,
} from '@/lib/stage-gate-highlight';
import { cn } from '@/lib/utils';

export type ExpenseDetailStageGateHighlight = SheetStageGateHighlight;

export const EXPENSE_GATE_FIELD_PAYMENTS = 'payments' as const;
export const EXPENSE_GATE_FIELD_STATUS = 'status' as const;

export function buildExpenseGateRequiredFields(
  highlight: ExpenseDetailStageGateHighlight | null,
): ReadonlySet<string> {
  if (!highlight?.errors.length) return new Set();
  return buildStageGateRequiredFields(highlight.errors);
}

export function expenseStageGateFieldClass(
  requiredFields: ReadonlySet<string>,
  field: string,
  className?: string,
): string {
  return stageGateFieldClass(requiredFields, field, className);
}

export function expenseStageGateSectionClass(
  requiredFields: ReadonlySet<string>,
  field: string,
  className?: string,
): string {
  return cn(
    'rounded-xl border p-4 transition-colors',
    expenseStageGateFieldClass(requiredFields, field, className),
  );
}
