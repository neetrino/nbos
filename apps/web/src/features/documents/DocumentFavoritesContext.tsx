'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { documentsApi, type DocumentListItem } from '@/lib/api/documents';

interface DocumentFavoritesContextValue {
  favorites: DocumentListItem[];
  favoriteIds: ReadonlySet<string>;
  loading: boolean;
  toggle: (doc: DocumentListItem, currentlyFavorite: boolean) => Promise<void>;
  isFavorited: (id: string) => boolean;
}

const DocumentFavoritesContext = createContext<DocumentFavoritesContextValue | null>(null);

export function DocumentFavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<DocumentListItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<ReadonlySet<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const list = await documentsApi.listFavorites();
      setFavorites(list);
      setFavoriteIds(new Set(list.map((d) => d.id)));
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = useCallback(async (doc: DocumentListItem, currentlyFavorite: boolean) => {
    const next = !currentlyFavorite;

    // Optimistic update
    if (next) {
      setFavorites((prev) => [
        { ...doc, isFavorite: true },
        ...prev.filter((d) => d.id !== doc.id),
      ]);
      setFavoriteIds((prev) => new Set([...prev, doc.id]));
    } else {
      setFavorites((prev) => prev.filter((d) => d.id !== doc.id));
      setFavoriteIds((prev) => {
        const updated = new Set(prev);
        updated.delete(doc.id);
        return updated;
      });
    }

    try {
      if (next) {
        await documentsApi.favoriteDocument(doc.id);
      } else {
        await documentsApi.unfavoriteDocument(doc.id);
      }
    } catch {
      // Rollback on error
      if (next) {
        setFavorites((prev) => prev.filter((d) => d.id !== doc.id));
        setFavoriteIds((prev) => {
          const updated = new Set(prev);
          updated.delete(doc.id);
          return updated;
        });
      } else {
        setFavorites((prev) => [{ ...doc, isFavorite: true }, ...prev]);
        setFavoriteIds((prev) => new Set([...prev, doc.id]));
      }
    }
  }, []);

  const isFavorited = useCallback((id: string) => favoriteIds.has(id), [favoriteIds]);

  return (
    <DocumentFavoritesContext.Provider
      value={{ favorites, favoriteIds, loading, toggle, isFavorited }}
    >
      {children}
    </DocumentFavoritesContext.Provider>
  );
}

export function useDocumentFavorites() {
  const ctx = useContext(DocumentFavoritesContext);
  if (!ctx) throw new Error('useDocumentFavorites must be used within DocumentFavoritesProvider');
  return ctx;
}
