import type { DeliveryLifecycleProjection } from '../delivery-lifecycle';

interface ExtensionForStageReadiness {
  status?: string | null;
  description?: string | null;
  assignedTo?: string | null;
  order?: {
    id?: string | null;
    status?: string | null;
    paymentType?: string | null;
    invoices?: Array<{ moneyStatus: string }>;
  } | null;
}

export function buildExtensionCurrentStageReadiness(
  extension: ExtensionForStageReadiness,
  lifecycle: DeliveryLifecycleProjection,
): { completed: number; total: number } | undefined {
  if (lifecycle.isTerminal || !lifecycle.stage) return undefined;
  if (lifecycle.stage !== 'STARTING') return undefined;

  const checks = [Boolean(extension.description?.trim()), Boolean(extension.assignedTo)];
  const completed = checks.filter(Boolean).length;
  return { completed, total: checks.length };
}
