'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CLIENT_OPEN_CONVERSATION_QUERY } from './client-messenger.constants';
import type { ClientMessengerSectionId } from './client-messenger.constants';
import { useClientMessengerOverlay } from './client-messenger-overlay-context';

const CLIENT_MESSENGER_ROUTE_FALLBACK = '/dashboard';

/** `/client-messenger/*` is not a page. Open the shared sheet and leave the route. */
export function OpenClientMessengerRoute({ section }: { section: ClientMessengerSectionId }) {
  const { openClientMessenger } = useClientMessengerOverlay();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = useRef(searchParams.get(CLIENT_OPEN_CONVERSATION_QUERY)?.trim() || null);
  useEffect(() => {
    openClientMessenger(section, conversationId.current);
    router.replace(CLIENT_MESSENGER_ROUTE_FALLBACK);
  }, [openClientMessenger, router, section]);
  return null;
}
