import type { DeliveryLifecycleProjection } from '../delivery-lifecycle';

export interface ProductOpenCounts {
  openTasks: number;
  openTickets: number;
  openExtensions: number;
}

interface ProductForStageReadiness {
  status?: string | null;
  description?: string | null;
  deadline?: Date | string | null;
  clientAcceptedAt?: Date | string | null;
  order?: {
    id?: string | null;
    status?: string | null;
    invoices?: Array<{ moneyStatus: string }>;
  } | null;
}

export function buildProductCurrentStageReadiness(
  product: ProductForStageReadiness,
  lifecycle: DeliveryLifecycleProjection,
  open: ProductOpenCounts,
): { completed: number; total: number } | undefined {
  if (lifecycle.isTerminal || !lifecycle.stage) return undefined;

  const stage = lifecycle.stage;

  if (stage === 'STARTING') {
    const checks = [Boolean(product.deadline)];
    const completed = checks.filter(Boolean).length;
    return { completed, total: checks.length };
  }

  if (stage === 'DEVELOPMENT' || stage === 'QA') {
    const clear = open.openTasks === 0;
    return { completed: clear ? 1 : 0, total: 1 };
  }

  if (stage === 'TRANSFER') {
    const invoices = product.order?.invoices ?? [];
    const unpaidInvoices = invoices.filter((inv) => inv.moneyStatus !== 'PAID').length;
    const orderOk =
      !product.order?.status || ['FULLY_PAID', 'CLOSED'].includes(product.order.status);

    const checks = [
      open.openExtensions === 0,
      open.openTasks === 0,
      open.openTickets === 0,
      Boolean(product.clientAcceptedAt),
      orderOk,
      unpaidInvoices === 0,
    ];
    const completed = checks.filter(Boolean).length;
    return { completed, total: checks.length };
  }

  return undefined;
}
