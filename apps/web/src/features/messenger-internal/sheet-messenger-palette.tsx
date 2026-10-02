'use client';

import { createContext, useContext, type ReactNode } from 'react';

export type SheetMessengerPalette = {
  canvas: string;
  ownBubble: string;
  seenCheck: string;
  unseenCheck: string;
  send: string;
  tip: string;
  incomingAvatar: string;
};

const INTERNAL_SHEET_PALETTE: SheetMessengerPalette = {
  canvas: 'bg-[#eef2ff] dark:bg-background',
  ownBubble: 'bg-[#4f46e5] dark:bg-primary',
  seenCheck: 'text-white',
  unseenCheck: 'text-white/40',
  send: 'bg-[#4f46e5] dark:bg-primary',
  tip: 'text-[#4f46e5] dark:text-primary',
  incomingAvatar:
    'border border-[#fcd34d] bg-[#fef3c7] text-[#92400e] dark:border-amber-800/50 dark:bg-amber-950/60 dark:text-amber-100',
};

const CLIENT_SHEET_PALETTE: SheetMessengerPalette = {
  canvas: 'bg-[#EAF3F3] dark:bg-background',
  ownBubble: 'bg-teal-800',
  seenCheck: 'text-white',
  unseenCheck: 'text-white/40',
  send: 'bg-teal-800',
  tip: 'text-teal-800 dark:text-teal-300',
  incomingAvatar:
    'border border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-100',
};

const SheetPaletteContext = createContext(INTERNAL_SHEET_PALETTE);

export function SheetMessengerPaletteProvider({
  kind,
  children,
}: {
  kind: 'internal' | 'client';
  children: ReactNode;
}) {
  const palette = kind === 'client' ? CLIENT_SHEET_PALETTE : INTERNAL_SHEET_PALETTE;
  return <SheetPaletteContext.Provider value={palette}>{children}</SheetPaletteContext.Provider>;
}

export function useSheetMessengerPalette(): SheetMessengerPalette {
  return useContext(SheetPaletteContext);
}
