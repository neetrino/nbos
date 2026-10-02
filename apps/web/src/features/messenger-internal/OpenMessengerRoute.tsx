'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { InternalMessengerSectionId } from './internal-messenger.constants';
import { useMessengerOverlay } from './messenger-overlay-context';

const MESSENGER_ROUTE_FALLBACK = '/dashboard';

/** `/messenger/*` is not a page. Open the shared sheet and leave the route. */
export function OpenMessengerRoute({ section }: { section: InternalMessengerSectionId }) {
  const { openMessenger } = useMessengerOverlay();
  const router = useRouter();
  useEffect(() => {
    openMessenger(section);
    router.replace(MESSENGER_ROUTE_FALLBACK);
  }, [openMessenger, router, section]);
  return null;
}
