import type { StageGateError } from '../stage-gates/types';

/** Task statuses treated as closed for product stage gates (includes legacy DONE). */
export const PRODUCT_GATE_CLOSED_TASK_STATUSES = ['ON_HOLD', 'COMPLETED', 'DONE'] as const;

export const PRODUCT_ALLOWED_TRANSITIONS: Record<string, string[]> = {
  NEW: ['CREATING', 'DEVELOPMENT', 'LOST'],
  CREATING: ['DEVELOPMENT', 'ON_HOLD', 'LOST'],
  DEVELOPMENT: ['QA', 'ON_HOLD', 'LOST'],
  QA: ['TRANSFER', 'DEVELOPMENT', 'ON_HOLD', 'LOST'],
  TRANSFER: ['DONE', 'ON_HOLD', 'LOST'],
  ON_HOLD: ['CREATING', 'DEVELOPMENT', 'QA', 'TRANSFER', 'LOST'],
  DONE: [],
  LOST: [],
};

export interface ProductStageGateInput {
  status?: string | null;
  description?: string | null;
  deadline?: Date | string | null;
  clientAcceptedAt?: Date | string | null;
  order?: { id: string; status?: string; invoices?: Array<{ moneyStatus: string }> } | null;
  extensions?: Array<{ status: string }>;
  tasks?: Array<{ status: string }>;
  tickets?: Array<{ status: string }>;
}

export function getProductAllowedTransitions(current: string): string[] {
  return PRODUCT_ALLOWED_TRANSITIONS[current] ?? [];
}

export function isProductTransitionAllowed(current: string, target: string): boolean {
  return getProductAllowedTransitions(current).includes(target);
}

export function getProductStageGateErrors(
  product: ProductStageGateInput,
  targetStatus: string,
): StageGateError[] {
  if (product.status === 'NEW' && targetStatus === 'CREATING') {
    return getProductCreatingGateErrors(product);
  }
  if (product.status === 'DEVELOPMENT' && targetStatus === 'QA') {
    return buildOpenItemErrors(
      'tasks',
      product.tasks ?? [],
      PRODUCT_GATE_CLOSED_TASK_STATUSES,
      'Product QA',
    );
  }
  if (product.status === 'QA' && targetStatus === 'TRANSFER') {
    return buildOpenItemErrors(
      'tasks',
      product.tasks ?? [],
      PRODUCT_GATE_CLOSED_TASK_STATUSES,
      'Product Transfer',
    );
  }
  if (targetStatus === 'DONE') {
    return getProductDoneGateErrors(product);
  }
  return [];
}

function getProductCreatingGateErrors(product: ProductStageGateInput): StageGateError[] {
  const errors: StageGateError[] = [];
  if (!product.description?.trim()) {
    errors.push({ field: 'description', message: 'Description is required before Creating.' });
  }
  if (!product.deadline) {
    errors.push({ field: 'deadline', message: 'Deadline is required before Creating.' });
  }
  if (!product.order?.id) {
    errors.push({ field: 'order', message: 'Order is required before Creating.' });
  }
  return errors;
}

function getProductDoneGateErrors(product: ProductStageGateInput): StageGateError[] {
  return [
    ...buildOpenItemErrors(
      'extensions',
      product.extensions ?? [],
      ['DONE', 'LOST'],
      'Product Done',
    ),
    ...buildOpenItemErrors(
      'tasks',
      product.tasks ?? [],
      PRODUCT_GATE_CLOSED_TASK_STATUSES,
      'Product Done',
    ),
    ...buildOpenItemErrors(
      'tickets',
      product.tickets ?? [],
      ['RESOLVED', 'CLOSED'],
      'Product Done',
    ),
    ...buildClientAcceptanceErrors(product),
    ...buildOpenOrderErrors(product.order),
    ...buildUnpaidInvoiceErrors(product.order?.invoices ?? []),
  ];
}

function buildClientAcceptanceErrors(product: ProductStageGateInput): StageGateError[] {
  if (product.clientAcceptedAt) return [];
  return [
    {
      field: 'clientAcceptance',
      message: 'Client acceptance must be recorded before Product Done.',
    },
  ];
}

function buildOpenOrderErrors(order: ProductStageGateInput['order']): StageGateError[] {
  if (!order?.status || ['FULLY_PAID', 'CLOSED'].includes(order.status)) return [];
  return [
    {
      field: 'finance',
      message: `Order ${order.status} must be fully paid or closed before Product Done.`,
    },
  ];
}

function buildUnpaidInvoiceErrors(invoices: Array<{ moneyStatus: string }>): StageGateError[] {
  const unpaidCount = invoices.filter((invoice) => invoice.moneyStatus !== 'PAID').length;
  if (unpaidCount === 0) return [];
  return [
    {
      field: 'finance',
      message: `${unpaidCount} invoices still require payment before Product Done.`,
    },
  ];
}

function buildOpenItemErrors(
  field: string,
  items: Array<{ status: string }>,
  closedStatuses: readonly string[],
  targetLabel: string,
): StageGateError[] {
  const openCount = items.filter((item) => !closedStatuses.includes(item.status)).length;
  if (openCount === 0) return [];
  return [
    {
      field,
      message: `${openCount} ${field} still require completion before ${targetLabel}.`,
    },
  ];
}
