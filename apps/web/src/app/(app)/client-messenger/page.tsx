'use client';

import { Suspense } from 'react';
import { OpenClientMessengerRoute } from '@/features/messenger-client/OpenClientMessengerRoute';

export default function ClientMessengerInboxPage() {
  return (
    <Suspense fallback={null}>
      <OpenClientMessengerRoute section="inbox" />
    </Suspense>
  );
}
