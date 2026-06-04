import { StatusBadge } from '@/components/shared';
import type { FullProduct } from '@/lib/api/products';
import {
  formatDeliveryLifecycleLabel,
  getDeliveryLifecycleVariant,
  getProductStatus,
  isDeliveryHoldExpired,
} from '@/features/projects/constants/projects';

interface ProductStageGateSummaryProps {
  product: FullProduct;
  nextStatuses: string[];
}

export function ProductStageGateSummary({ product, nextStatuses }: ProductStageGateSummaryProps) {
  const lifecycle = product.deliveryLifecycle;
  const nextLabels = nextStatuses.map((status) => getProductStatus(status)?.label ?? status);

  return (
    <div className="bg-muted/25 rounded-lg border px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-wide uppercase">Current state</p>
        {lifecycle && (
          <StatusBadge
            label={formatDeliveryLifecycleLabel(lifecycle)}
            variant={getDeliveryLifecycleVariant(lifecycle)}
          />
        )}
      </div>
      <p className="text-muted-foreground mt-1.5 text-xs leading-snug">
        {getGateFocus(product.status)}
      </p>
      <p className="text-muted-foreground mt-1.5 text-[11px]">
        Next: {nextLabels.length > 0 ? nextLabels.join(' · ') : getNoMoveCopy(product)}
      </p>
    </div>
  );
}

function getGateFocus(status: string) {
  if (status === 'NEW' || status === 'CREATING') {
    return 'Prepare kickoff context, PM ownership, deadline and delivery scope before Development.';
  }
  if (status === 'DEVELOPMENT') {
    return 'Close active execution work before moving to QA.';
  }
  if (status === 'QA') {
    return 'Resolve QA blockers before Transfer, or move back to Development for fixes.';
  }
  if (status === 'TRANSFER') {
    return 'Complete acceptance, open work and finance checks before Done.';
  }
  return 'No active stage-gate requirements for this delivery state.';
}

function getNoMoveCopy(product: FullProduct) {
  if (product.deliveryLifecycle && isDeliveryHoldExpired(product.deliveryLifecycle)) {
    return 'hold expired, resume delivery first';
  }
  if (product.deliveryLifecycle?.workStatus === 'ON_HOLD') return 'resume delivery first';
  if (product.deliveryLifecycle?.resolution === 'DONE') return 'product is done';
  if (product.deliveryLifecycle?.resolution === 'CANCELLED') return 'product is cancelled';
  return 'no configured transition';
}
