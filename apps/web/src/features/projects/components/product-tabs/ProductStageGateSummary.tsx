import { StatusBadge } from '@/components/shared';
import type { FullProduct } from '@/lib/api/products';
import {
  formatDeliveryLifecycleLabel,
  getDeliveryLifecycleVariant,
  getProductStatus,
} from '@/features/projects/constants/projects';

interface ProductStageGateSummaryProps {
  product: FullProduct;
  nextStatuses: string[];
}

export function ProductStageGateSummary({ product, nextStatuses }: ProductStageGateSummaryProps) {
  const lifecycle = product.deliveryLifecycle;
  const nextLabels = nextStatuses.map((status) => getProductStatus(status)?.label ?? status);

  return (
    <div className="bg-muted/30 mb-4 rounded-xl border p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold">Current delivery state</p>
          <p className="text-muted-foreground mt-1 text-xs">{getGateFocus(product.status)}</p>
        </div>
        {lifecycle && (
          <StatusBadge
            label={formatDeliveryLifecycleLabel(lifecycle)}
            variant={getDeliveryLifecycleVariant(lifecycle)}
          />
        )}
      </div>
      <p className="text-muted-foreground mt-3 text-xs">
        Next allowed move: {nextLabels.length > 0 ? nextLabels.join(' / ') : getNoMoveCopy(product)}
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
  if (product.deliveryLifecycle?.workStatus === 'ON_HOLD') return 'resume delivery first';
  if (product.deliveryLifecycle?.resolution === 'DONE') return 'product is done';
  if (product.deliveryLifecycle?.resolution === 'CANCELLED') return 'product is cancelled';
  return 'no configured transition';
}
