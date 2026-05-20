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

export function getExtensionStageGateErrors(
  extension: ExtensionStageGateInput,
  targetStatus: string,
): StageGateError[] {
  if (extension.status === 'NEW' && targetStatus === 'DEVELOPMENT') {
    return buildExtensionReadiness(extension).missing;
  }
  if (targetStatus === 'DONE') {
    return getExtensionDoneGateErrors(extension);
  }
  return [];
}

function getExtensionDoneGateErrors(extension: ExtensionStageGateInput): StageGateError[] {
  const errors: StageGateError[] = [];
  const openTaskCount = (extension.tasks ?? []).filter((task) => !isClosedTask(task.status)).length;
  if (openTaskCount > 0) {
    errors.push({
      field: 'tasks',
      message: `${openTaskCount} tasks still require completion before Extension Done.`,
    });
  }
  return [
    ...errors,
    ...buildOpenOrderErrors(extension.order),
    ...buildUnpaidInvoiceErrors(extension.order?.invoices ?? []),
  ];
}

function isClosedTask(status: string): boolean {
  return ['COMPLETED', 'ON_HOLD', 'DONE'].includes(status);
}

function buildOpenOrderErrors(order: ExtensionStageGateInput['order']): StageGateError[] {
  if (!order?.status || ['FULLY_PAID', 'CLOSED'].includes(order.status)) return [];
  return [
    {
      field: 'finance',
      message: `Order ${order.status} must be fully paid or closed before Extension Done.`,
    },
  ];
}

function buildUnpaidInvoiceErrors(invoices: Array<{ moneyStatus: string }>): StageGateError[] {
  const unpaidCount = invoices.filter((invoice) => invoice.moneyStatus !== 'PAID').length;
  if (unpaidCount === 0) return [];
  return [
    {
      field: 'finance',
      message: `${unpaidCount} invoices still require payment before Extension Done.`,
    },
  ];
}
