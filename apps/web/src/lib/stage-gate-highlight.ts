import { DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS } from '@/components/shared/detail-sheet-classes';
import type { ApiFieldError } from '@/lib/api-errors';
import { cn } from '@/lib/utils';

export type SheetStageGateHighlight = {
  errors: ApiFieldError[];
};

export function buildStageGateRequiredFields(errors: ApiFieldError[]): ReadonlySet<string> {
  return new Set(errors.map((error) => error.field));
}

export function stageGateFieldClass(
  requiredFields: ReadonlySet<string>,
  field: string,
  className?: string,
): string {
  return cn(className, requiredFields.has(field) && DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS);
}

export function splitStageGateErrors(
  errors: ApiFieldError[],
  actionBlockerFields: ReadonlySet<string>,
): {
  fieldErrors: ApiFieldError[];
  actionBlockers: ApiFieldError[];
} {
  const fieldErrors: ApiFieldError[] = [];
  const actionBlockers: ApiFieldError[] = [];
  for (const error of errors) {
    if (actionBlockerFields.has(error.field)) {
      actionBlockers.push(error);
    } else {
      fieldErrors.push(error);
    }
  }
  return { fieldErrors, actionBlockers };
}
