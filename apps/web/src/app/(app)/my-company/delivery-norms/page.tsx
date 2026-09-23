import { Suspense } from 'react';
import { LoadingState } from '@/components/shared';
import { LOADING_CARD_COUNT } from '@/features/my-company/delivery-norms/delivery-norms.constants';
import { DeliveryNormsPage } from '@/features/my-company/delivery-norms/delivery-norms-page';

export default function DeliveryNormsRoutePage() {
  return (
    <Suspense fallback={<LoadingState variant="cards" count={LOADING_CARD_COUNT} />}>
      <DeliveryNormsPage />
    </Suspense>
  );
}
