import { DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS } from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';

export function dealStageGateFieldClass(
  requiredFields: ReadonlySet<string>,
  field: string,
  className?: string,
): string {
  return cn(className, requiredFields.has(field) && DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS);
}

const ACTION_BLOCKER_KEYWORDS = ['invoice', 'payment', 'contract', 'override'] as const;

export function isDealStageActionBlocker(field: string): boolean {
  const normalized = field.toLowerCase();
  return ACTION_BLOCKER_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function splitDealStageGateErrors(errors: Array<{ field: string; message: string }>): {
  fieldErrors: Array<{ field: string; message: string }>;
  actionBlockers: Array<{ field: string; message: string }>;
} {
  const fieldErrors: Array<{ field: string; message: string }> = [];
  const actionBlockers: Array<{ field: string; message: string }> = [];
  for (const error of errors) {
    if (isDealStageActionBlocker(error.field)) {
      actionBlockers.push(error);
    } else {
      fieldErrors.push(error);
    }
  }
  return { fieldErrors, actionBlockers };
}
