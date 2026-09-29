'use client';

import { Suspense } from 'react';
import { OpenClientMessengerRoute } from '@/features/messenger-client/OpenClientMessengerRoute';

export default function ClientMessengerClientsPage() {
  return (
    <Suspense fallback={null}>
      <OpenClientMessengerRoute section="clients" />
    </Suspense>
  );
}
