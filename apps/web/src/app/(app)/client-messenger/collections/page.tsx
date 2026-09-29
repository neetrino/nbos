'use client';

import { Suspense } from 'react';
import { OpenClientMessengerRoute } from '@/features/messenger-client/OpenClientMessengerRoute';

export default function ClientMessengerCollectionsPage() {
  return (
    <Suspense fallback={null}>
      <OpenClientMessengerRoute section="collections" />
    </Suspense>
  );
}
