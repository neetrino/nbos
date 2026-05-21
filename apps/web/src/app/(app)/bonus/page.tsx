'use client';

import { Suspense } from 'react';
import { LoadingState } from '@/components/shared';
import { BonusBoardPageContent } from '@/features/finance/components/bonus/BonusBoardPageContent';

export default function BonusPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <BonusBoardPageContent />
    </Suspense>
  );
}
