import type { ApiFieldError } from '@/lib/api-errors';
import {
  buildStageGateRequiredFields,
  splitStageGateErrors,
  stageGateFieldClass,
  type SheetStageGateHighlight,
} from '@/lib/stage-gate-highlight';
import type { DeliveryDetailTabId } from './delivery-item-detail.constants';

export type DeliverySheetStageGateHighlight = SheetStageGateHighlight;

const DELIVERY_ACTION_BLOCKER_FIELDS = new Set([
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
  return stageGateFieldClass(requiredFields, field, className);
}

export function deliveryStageGateSectionClass(
  requiredFields: ReadonlySet<string>,
  field: string,
  className?: string,
): string {
  return stageGateFieldClass(requiredFields, field, className);
}

export function isDeliveryStageActionBlocker(field: string): boolean {
  return DELIVERY_ACTION_BLOCKER_FIELDS.has(field);
}

export function splitDeliveryStageGateErrors(errors: ApiFieldError[]): {
  fieldErrors: ApiFieldError[];
  actionBlockers: ApiFieldError[];
} {
  return splitStageGateErrors(errors, DELIVERY_ACTION_BLOCKER_FIELDS);
}

/** Prefer Work Space when execution items block the transition. */
export function resolveDeliveryDetailPanelFromErrors(errors: ApiFieldError[]): DeliveryDetailTabId {
  const fields = buildStageGateRequiredFields(errors);
  if (fields.has('tasks') || fields.has('extensions') || fields.has('tickets')) {
    return 'workspace';
  }
  return 'general';
}
