import type { StatusVariant } from '@/components/shared';
import { resolveKanbanStageHex } from '@/components/shared/kanban/kanban-stage-hex';
import type { ClientServicePaymentStage } from '@/lib/api/client-services';

interface ClientServiceStageMeta {
  label: string;
  variant: StatusVariant;
  color: string;
}

/**
 * Status board column order left → right: urgency decreases toward Active on the right.
 * Cards visually progress from Pay now (left) to Active (right, green).
 */
export const CLIENT_SERVICE_STAGE_ORDER: readonly ClientServicePaymentStage[] = [
  'pay_now',
  'invoice',
  'upcoming',
  'active',
];

const STAGE_META: Record<ClientServicePaymentStage, ClientServiceStageMeta> = {
  active: { label: 'Active', variant: 'green', color: 'bg-green-600' },
  upcoming: { label: 'Upcoming', variant: 'blue', color: 'bg-blue-500' },
  invoice: { label: 'Invoice', variant: 'violet', color: 'bg-violet-600' },
  pay_now: { label: 'Pay now', variant: 'amber', color: 'bg-amber-500' },
};

export const CLIENT_SERVICE_BOARD_COLUMN_WIDTH = 280;

export const CLIENT_SERVICE_OVERDUE_VARIANT: StatusVariant = 'red';
export const CLIENT_SERVICE_OVERDUE_LABEL = 'Overdue';

export function clientServiceStageLabel(stage: ClientServicePaymentStage): string {
  return STAGE_META[stage].label;
}

export function clientServiceStageVariant(stage: ClientServicePaymentStage): StatusVariant {
  return STAGE_META[stage].variant;
}

export function clientServiceStageHex(stage: ClientServicePaymentStage): string {
  return resolveKanbanStageHex(STAGE_META[stage].color) ?? '#6B7280';
}
