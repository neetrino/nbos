import type { StageGateError } from '../stage-gates/types';

export const EXTENSION_ALLOWED_TRANSITIONS: Record<string, string[]> = {
  NEW: ['DEVELOPMENT', 'LOST'],
  DEVELOPMENT: ['QA', 'LOST'],
  QA: ['TRANSFER', 'DEVELOPMENT', 'LOST'],
  TRANSFER: ['DONE', 'LOST'],
  DONE: [],
  LOST: [],
};

export interface ExtensionStageGateInput {
  status?: string | null;
  description?: string | null;
  assignedTo?: string | null;
  order?: {
    id: string;
    status?: string | null;
    paymentType?: string | null;
    invoices?: Array<{ moneyStatus: string }>;
  } | null;
  tasks?: Array<{ status: string }>;
}

export interface ExtensionReadinessSummary {
  isReadyForDevelopment: boolean;
  missing: StageGateError[];
}

export function getExtensionAllowedTransitions(current: string): string[] {
  return EXTENSION_ALLOWED_TRANSITIONS[current] ?? [];
}

export function isExtensionTransitionAllowed(current: string, target: string): boolean {
  return getExtensionAllowedTransitions(current).includes(target);
}

export function buildExtensionReadiness(
  extension: ExtensionStageGateInput,
): ExtensionReadinessSummary {
  const missing: StageGateError[] = [];
  if (extension.status !== 'NEW') return { isReadyForDevelopment: true, missing };

  if (!extension.description?.trim()) {
    missing.push({ field: 'description', message: 'Description is required before Development' });
  }
  if (!extension.assignedTo) {
    missing.push({ field: 'assignedTo', message: 'Assignee is required before Development' });
  }

  return { isReadyForDevelopment: missing.length === 0, missing };
}

/**
 * Stage movement checks. Open tasks are not a gate: an extension may keep
 * future work open through Done.
 */
export function getExtensionStageGateErrors(
  extension: ExtensionStageGateInput,
  targetStatus: string,
): StageGateError[] {
  if (extension.status === 'NEW' && targetStatus === 'DEVELOPMENT') {
    return buildExtensionReadiness(extension).missing;
  }
  return [];
}
