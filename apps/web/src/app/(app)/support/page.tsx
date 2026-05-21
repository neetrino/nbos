import { Suspense } from 'react';
import { SupportPageView } from '@/features/support/components/SupportPageView';
import { LoadingState } from '@/components/shared';

export default function SupportPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SupportPageView />
    </Suspense>
  );
}
