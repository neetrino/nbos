import type { ApiFieldError } from '@/lib/api-errors';
import {
  buildStageGateRequiredFields,
  splitStageGateErrors,
  stageGateFieldClass,
} from '@/lib/stage-gate-highlight';

export type ProductTabForGate = 'overview' | 'tasks' | 'extensions' | 'support' | 'finance';

const PRODUCT_ACTION_BLOCKER_FIELDS = new Set([
  'tasks',
  'extensions',
  'tickets',
  'finance',
  'order',
  'clientAcceptance',
  'checklist',
]);

export function productStageGateFieldClass(
  requiredFields: ReadonlySet<string>,
  field: string,
  className?: string,
): string {
  return stageGateFieldClass(requiredFields, field, className);
}

export function splitProductStageGateErrors(errors: ApiFieldError[]): {
  fieldErrors: ApiFieldError[];
  actionBlockers: ApiFieldError[];
} {
  return splitStageGateErrors(errors, PRODUCT_ACTION_BLOCKER_FIELDS);
}

export function buildProductGateRequiredFields(errors: ApiFieldError[]): ReadonlySet<string> {
  return buildStageGateRequiredFields(errors);
}

export function resolveProductTabFromGateErrors(errors: ApiFieldError[]): ProductTabForGate {
  const fields = buildStageGateRequiredFields(errors);
  if (fields.has('tasks')) return 'tasks';
  if (fields.has('extensions')) return 'extensions';
  if (fields.has('tickets')) return 'support';
  if (fields.has('finance') || fields.has('order')) return 'finance';
  return 'overview';
}

export function resolveProductTabFromBlockerActionKey(key: string): ProductTabForGate {
  if (key === 'product-workspace-tasks') return 'tasks';
  if (key === 'product-support-tickets') return 'support';
  if (key === 'product-extensions') return 'extensions';
  if (key === 'product-finance') return 'finance';
  return 'overview';
}
