'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { SearchHit } from '@/lib/api/search';

export type GlobalSearchEntitySheetsApi = {
  openSearchHit: (hit: SearchHit) => void;
};

const GlobalSearchEntitySheetsCtx = createContext<GlobalSearchEntitySheetsApi | null>(null);

export function GlobalSearchEntitySheetsProvider({
  value,
  children,
}: {
  value: GlobalSearchEntitySheetsApi;
  children: ReactNode;
}) {
  return (
    <GlobalSearchEntitySheetsCtx.Provider value={value}>
      {children}
    </GlobalSearchEntitySheetsCtx.Provider>
  );
}

export function useGlobalSearchEntitySheets(): GlobalSearchEntitySheetsApi {
  const ctx = useContext(GlobalSearchEntitySheetsCtx);
  if (!ctx) {
    throw new Error('useGlobalSearchEntitySheets must be used within GlobalSearchEntitySheetsHost');
  }
  return ctx;
}
