'use client';

import { createContext, useContext, type ReactNode } from 'react';

export type SheetMessengerPalette = {
  canvas: string;
  ownBubble: string;
  seenCheck: string;
  send: string;
  tip: string;
  incomingAvatar: string;
};

const INTERNAL_SHEET_PALETTE: SheetMessengerPalette = {
  canvas: 'bg-[#eef2ff]',
  ownBubble: 'bg-[#4f46e5]',
  seenCheck: 'text-[#93c5fd]',
  send: 'bg-[#4f46e5]',
  tip: 'text-[#4f46e5]',
  incomingAvatar: 'border border-[#fcd34d] bg-[#fef3c7] text-[#92400e]',
};

const CLIENT_SHEET_PALETTE: SheetMessengerPalette = {
  canvas: 'bg-[#EAF3F3]',
  ownBubble: 'bg-teal-800',
  seenCheck: 'text-teal-200',
  send: 'bg-teal-800',
  tip: 'text-teal-800',
  incomingAvatar: 'border border-teal-200 bg-teal-50 text-teal-900',
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
