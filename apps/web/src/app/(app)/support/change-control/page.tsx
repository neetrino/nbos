import { Suspense } from 'react';
import { LoadingState } from '@/components/shared';
import { SupportChangeControlView } from '@/features/support/components/SupportChangeControlView';

export default function SupportChangeControlPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SupportChangeControlView />
    </Suspense>
  );
}
