'use client';

import { Suspense } from 'react';
import { LoadingState } from '@/components/shared';
import { UnitEconomicsPageContent } from '@/features/finance/components/unit-economics/UnitEconomicsPageContent';

export default function UnitEconomicsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <UnitEconomicsPageContent />
    </Suspense>
  );
}
