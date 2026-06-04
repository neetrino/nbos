import type { StatusVariant } from '@/components/shared';
import { DELIVERY_STAGE_LABELS } from '@/features/projects/components/delivery-board/project-delivery-board-model';
import { getProductStatus } from './projects';

type DeliveryStage = keyof typeof DELIVERY_STAGE_LABELS;

const DELIVERY_STAGE_BADGE_VARIANTS: Record<DeliveryStage, StatusVariant> = {
  STARTING: 'violet',
  DEVELOPMENT: 'blue',
  QA: 'orange',
  TRANSFER: 'green',
};

/** Legacy product status → canonical delivery stage (matches Delivery Board columns). */
const LEGACY_STATUS_TO_DELIVERY_STAGE: Record<string, DeliveryStage> = {
  NEW: 'STARTING',
  CREATING: 'STARTING',
  DEVELOPMENT: 'DEVELOPMENT',
  QA: 'QA',
  TRANSFER: 'TRANSFER',
};

function deliveryStageBadge(stage: DeliveryStage): { label: string; variant: StatusVariant } {
  return {
    label: DELIVERY_STAGE_LABELS[stage],
    variant: DELIVERY_STAGE_BADGE_VARIANTS[stage],
  };
}

function resolveDeliveryStage(product: {
  status: string;
  deliveryLifecycle?: { stage: string | null; resolution: string | null };
}): DeliveryStage | null {
  const stage = product.deliveryLifecycle?.stage;
  if (stage && stage in DELIVERY_STAGE_LABELS) {
    return stage as DeliveryStage;
  }
  return LEGACY_STATUS_TO_DELIVERY_STAGE[product.status] ?? null;
}

/** Canonical delivery stage badge — same labels as Delivery Board columns. */
export function getProductDeliveryStageBadgeDisplay(product: {
  status: string;
  deliveryLifecycle?: {
    stage: string | null;
    resolution: string | null;
  };
}): { label: string; variant: StatusVariant } | undefined {
  const lc = product.deliveryLifecycle;
  if (lc?.resolution === 'DONE') return getProductStatus('DONE');
  if (lc?.resolution === 'CANCELLED') {
    return { label: 'Cancelled', variant: 'red' };
  }

  const stage = resolveDeliveryStage(product);
  if (stage) return deliveryStageBadge(stage);

  return getProductStatus(product.status);
}
