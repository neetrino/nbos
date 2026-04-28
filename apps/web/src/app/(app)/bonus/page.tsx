'use client';

import { Suspense } from 'react';
import { LoadingState } from '@/components/shared';
import { BonusBoardPageContent } from '@/features/finance/components/bonus/BonusBoardPageContent';

export default function BonusPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full flex-col">
          <div className="mb-4">
            <h1 className="text-foreground text-2xl font-semibold">Bonus Board</h1>
            <p className="text-muted-foreground mt-1 text-sm">Loading…</p>
          </div>
          <LoadingState />
        </div>
      }
    >
      <BonusBoardPageContent />
    </Suspense>
  );
}
