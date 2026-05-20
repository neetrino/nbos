import { DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS } from '@/components/shared/detail-sheet-classes';
import type { ApiFieldError } from '@/lib/api-errors';
import { cn } from '@/lib/utils';
import type { DeliveryDetailTabId } from './delivery-item-detail.constants';

export type DeliverySheetStageGateHighlight = {
  errors: ApiFieldError[];
};

const ACTION_BLOCKER_FIELDS = new Set([
  'tasks',
  'extensions',
  'tickets',
  'finance',
  'clientAcceptance',
]);

export function deliveryStageGateFieldClass(
  requiredFields: ReadonlySet<string>,
  field: string,
  className?: string,
): string {
  return cn(className, requiredFields.has(field) && DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS);
}

export function deliveryStageGateSectionClass(
  requiredFields: ReadonlySet<string>,
  field: string,
  className?: string,
): string {
  return deliveryStageGateFieldClass(requiredFields, field, className);
}

export function isDeliveryStageActionBlocker(field: string): boolean {
  return ACTION_BLOCKER_FIELDS.has(field);
}

export function splitDeliveryStageGateErrors(errors: ApiFieldError[]): {
  fieldErrors: ApiFieldError[];
  actionBlockers: ApiFieldError[];
} {
  const fieldErrors: ApiFieldError[] = [];
  const actionBlockers: ApiFieldError[] = [];
  for (const error of errors) {
    if (isDeliveryStageActionBlocker(error.field)) {
      actionBlockers.push(error);
    } else {
      fieldErrors.push(error);
    }
  }
  return { fieldErrors, actionBlockers };
}

/** Prefer Work Space when execution items block the transition. */
export function resolveDeliveryDetailPanelFromErrors(errors: ApiFieldError[]): DeliveryDetailTabId {
  const fields = new Set(errors.map((error) => error.field));
  if (fields.has('tasks') || fields.has('extensions') || fields.has('tickets')) {
    return 'workspace';
  }
  return 'general';
}
