'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { SHEET_MOBILE_FLOATING_RAIL_ANCHOR_CLASS } from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';
import { InternalMessengerApp } from './InternalMessengerApp';
import type { InternalMessengerSectionId } from './internal-messenger.constants';

interface MessengerOverlayValue {
  isOpen: boolean;
  section: InternalMessengerSectionId;
  openMessenger: (section?: InternalMessengerSectionId) => void;
  closeMessenger: () => void;
  setSection: (section: InternalMessengerSectionId) => void;
}

const MessengerOverlayContext = createContext<MessengerOverlayValue | null>(null);

export function MessengerOverlayProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [section, setSection] = useState<InternalMessengerSectionId>('all');
  const openMessenger = useCallback((next: InternalMessengerSectionId = 'all') => {
    setSection(next);
    setOpen(true);
  }, []);
  const closeMessenger = useCallback(() => setOpen(false), []);
  const value = useMemo(
    () => ({ isOpen, section, openMessenger, closeMessenger, setSection }),
    [closeMessenger, isOpen, openMessenger, section],
  );
  return (
    <MessengerOverlayContext.Provider value={value}>{children}</MessengerOverlayContext.Provider>
  );
}

export function useMessengerOverlay(): MessengerOverlayValue {
  const value = useContext(MessengerOverlayContext);
  if (!value) {
    throw new Error('useMessengerOverlay must be used within MessengerOverlayProvider');
  }
  return value;
}

export function useMessengerOverlayOptional(): MessengerOverlayValue | null {
  return useContext(MessengerOverlayContext);
}

const MESSENGER_SHEET_PANEL_CLASS =
  'flex h-[calc(100vh-2.5vh)] min-h-0 w-full max-w-[100vw] flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[92vw] sm:max-w-none sm:data-[side=right]:w-[min(92vw,calc(100vw-2rem-2.75rem))]';

const MESSENGER_SHEET_RAIL_ANCHOR_CLASS = cn(
  SHEET_MOBILE_FLOATING_RAIL_ANCHOR_CLASS,
  'sm:right-[min(92vw,calc(100vw-2rem-2.75rem))]',
);

export function MessengerOverlay() {
  const { isOpen, section, closeMessenger, setSection } = useMessengerOverlay();
  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeMessenger();
      }}
    >
      <SheetContent
        side="right"
        floatingClose
        showCloseButton={false}
        floatingRailAnchorClassName={MESSENGER_SHEET_RAIL_ANCHOR_CLASS}
        className={MESSENGER_SHEET_PANEL_CLASS}
      >
        <SheetTitle className="sr-only">Messenger</SheetTitle>
        <SheetDescription className="sr-only">Internal messenger</SheetDescription>
        <InternalMessengerApp embedded section={section} onSectionChange={setSection} />
      </SheetContent>
    </Sheet>
  );
}
