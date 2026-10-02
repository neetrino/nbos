'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { SHEET_MOBILE_FLOATING_RAIL_ANCHOR_CLASS } from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';
import { ClientMessengerApp } from './ClientMessengerApp';
import type { ClientMessengerSectionId } from './client-messenger.constants';

interface ClientMessengerOverlayValue {
  isOpen: boolean;
  section: ClientMessengerSectionId;
  requestedConversationId: string | null;
  openClientMessenger: (section?: ClientMessengerSectionId, conversationId?: string | null) => void;
  closeClientMessenger: () => void;
  setSection: (section: ClientMessengerSectionId) => void;
  clearRequestedConversation: () => void;
}

const ClientMessengerOverlayContext = createContext<ClientMessengerOverlayValue | null>(null);

export function ClientMessengerOverlayProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [section, setSection] = useState<ClientMessengerSectionId>('inbox');
  const [requestedConversationId, setRequestedConversationId] = useState<string | null>(null);
  const openClientMessenger = useCallback(
    (next: ClientMessengerSectionId = 'inbox', conversationId: string | null = null) => {
      setSection(next);
      setRequestedConversationId(conversationId);
      setOpen(true);
    },
    [],
  );
  const closeClientMessenger = useCallback(() => setOpen(false), []);
  const clearRequestedConversation = useCallback(() => setRequestedConversationId(null), []);
  const value = useMemo(
    () => ({
      isOpen,
      section,
      requestedConversationId,
      openClientMessenger,
      closeClientMessenger,
      setSection,
      clearRequestedConversation,
    }),
    [
      clearRequestedConversation,
      closeClientMessenger,
      isOpen,
      openClientMessenger,
      requestedConversationId,
      section,
    ],
  );
  return (
    <ClientMessengerOverlayContext.Provider value={value}>
      {children}
    </ClientMessengerOverlayContext.Provider>
  );
}

export function useClientMessengerOverlay(): ClientMessengerOverlayValue {
  const value = useContext(ClientMessengerOverlayContext);
  if (!value) {
    throw new Error('useClientMessengerOverlay must be used within ClientMessengerOverlayProvider');
  }
  return value;
}

export function useClientMessengerOverlayOptional(): ClientMessengerOverlayValue | null {
  return useContext(ClientMessengerOverlayContext);
}

const CLIENT_SHEET_PANEL_CLASS =
  'flex h-[calc(100vh-2.5vh)] min-h-0 w-full max-w-[100vw] flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[92vw] sm:max-w-none sm:data-[side=right]:w-[min(92vw,calc(100vw-2rem-2.75rem))]';

const CLIENT_SHEET_RAIL_ANCHOR_CLASS = cn(
  SHEET_MOBILE_FLOATING_RAIL_ANCHOR_CLASS,
  'sm:right-[min(92vw,calc(100vw-2rem-2.75rem))]',
);

const CLIENT_SHEET_CLOSE_CLASS = '!bg-teal-800 !text-white hover:!bg-teal-900';

export function ClientMessengerOverlay() {
  const {
    isOpen,
    section,
    requestedConversationId,
    closeClientMessenger,
    setSection,
    clearRequestedConversation,
  } = useClientMessengerOverlay();
  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeClientMessenger();
      }}
    >
      <SheetContent
        side="right"
        floatingClose
        showCloseButton={false}
        stackAboveEntitySheet
        floatingRailVisible={isOpen}
        floatingRailAnchorClassName={CLIENT_SHEET_RAIL_ANCHOR_CLASS}
        floatingCloseClassName={CLIENT_SHEET_CLOSE_CLASS}
        className={CLIENT_SHEET_PANEL_CLASS}
      >
        <SheetTitle className="sr-only">Client Messenger</SheetTitle>
        <SheetDescription className="sr-only">Client messenger</SheetDescription>
        <ClientMessengerApp
          embedded
          section={section}
          onSectionChange={setSection}
          requestedConversationId={requestedConversationId}
          onRequestedConversationHandled={clearRequestedConversation}
        />
      </SheetContent>
    </Sheet>
  );
}
