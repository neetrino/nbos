'use client';

import { Suspense } from 'react';
import { OpenClientMessengerRoute } from '@/features/messenger-client/OpenClientMessengerRoute';

export default function ClientMessengerSalesPage() {
  return (
    <Suspense fallback={null}>
      <OpenClientMessengerRoute section="sales" />
    </Suspense>
  );
}
