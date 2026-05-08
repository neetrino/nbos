import type { FullExtension } from '@/lib/api/extensions';
import type { FullProduct } from '@/lib/api/products';
import type { DeliveryLifecycleProjection } from '@/lib/api/projects';
import { ProductStageGateSummary } from '../product-tabs/ProductStageGateSummary';
import { ChecklistStageProgressBanner } from './ChecklistStageProgressBanner';
import { DeliveryLifecycleStrip } from './DeliveryLifecycleStrip';
import { ExtensionStageGateBlurb } from './ExtensionStageGateBlurb';

interface DeliveryItemDetailRequirementsZoneProps {
  lifecycle: DeliveryLifecycleProjection | undefined;
  product: FullProduct | null;
  extension: FullExtension | null;
  productNextStatuses: string[];
}

export function DeliveryItemDetailRequirementsZone({
  lifecycle,
  product,
  extension,
  productNextStatuses,
}: DeliveryItemDetailRequirementsZoneProps) {
  return (
    <>
      <DeliveryLifecycleStrip lifecycle={lifecycle} />
      <ChecklistStageProgressBanner
        progress={product?.checklistStageProgress ?? extension?.checklistStageProgress}
      />
      <div className="border-border shrink-0 border-b px-5 py-3 sm:px-7">
        {product ? (
          <ProductStageGateSummary product={product} nextStatuses={productNextStatuses} />
        ) : null}
        {extension ? <ExtensionStageGateBlurb extension={extension} /> : null}
      </div>
    </>
  );
}
