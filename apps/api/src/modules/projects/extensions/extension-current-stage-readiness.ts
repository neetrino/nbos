import type { DeliveryLifecycleProjection } from '../delivery-lifecycle';

export interface ExtensionOpenCounts {
  openTasks: number;
}

interface ExtensionForStageReadiness {
  status?: string | null;
  description?: string | null;
  assignedTo?: string | null;
  order?: {
    id?: string | null;
    status?: string | null;
    invoices?: Array<{ moneyStatus: string }>;
  } | null;
}

export function buildExtensionCurrentStageReadiness(
  extension: ExtensionForStageReadiness,
  lifecycle: DeliveryLifecycleProjection,
  open: ExtensionOpenCounts,
): { completed: number; total: number } | undefined {
  if (lifecycle.isTerminal || !lifecycle.stage) return undefined;

  const stage = lifecycle.stage;

  if (stage === 'STARTING') {
    const checks = [Boolean(extension.description?.trim()), Boolean(extension.assignedTo)];
    const completed = checks.filter(Boolean).length;
    return { completed, total: checks.length };
  }

  if (stage === 'DEVELOPMENT' || stage === 'QA') {
    const clear = open.openTasks === 0;
    return { completed: clear ? 1 : 0, total: 1 };
  }

  if (stage === 'TRANSFER') {
    const invoices = extension.order?.invoices ?? [];
    const unpaidInvoices = invoices.filter((inv) => inv.moneyStatus !== 'PAID').length;
    const orderOk =
      !extension.order?.status || ['FULLY_PAID', 'CLOSED'].includes(extension.order.status);

    const checks = [open.openTasks === 0, orderOk, unpaidInvoices === 0];
    const completed = checks.filter(Boolean).length;
    return { completed, total: checks.length };
  }

  return undefined;
}
