'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileText, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHero, PageHeroSearch, EmptyState, ErrorState } from '@/components/shared';
import { documentsApi, type DocumentListItem, type DocumentRecentItem } from '@/lib/api/documents';
import { getApiErrorMessage } from '@/lib/api-errors';
import { useDebouncedValue } from '@/components/shared';
import { DOCUMENTS_SEARCH_DEBOUNCE_MS } from '@/features/documents/documents.constants';
import { DocumentsTable } from '@/features/documents/DocumentsTable';
import { useDocumentFavorites } from '@/features/documents/DocumentFavoritesContext';

const RECENT_DISPLAY_LIMIT = 20;

function DocListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full rounded" />
      ))}
    </div>
  );
}

export default function DocumentsHomePage() {
  const { favorites, loading: loadingFavorites } = useDocumentFavorites();
  const [recent, setRecent] = useState<DocumentRecentItem[]>([]);
  const [searchResults, setSearchResults] = useState<DocumentListItem[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, DOCUMENTS_SEARCH_DEBOUNCE_MS).trim();

  const loadBase = useCallback(async () => {
    setLoadingRecent(true);
    setError(null);
    try {
      const recentList = await documentsApi.listRecent();
      setRecent(recentList.slice(0, RECENT_DISPLAY_LIMIT));
    } catch (e) {
      setError(getApiErrorMessage(e, 'Documents could not be loaded.'));
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  useEffect(() => {
    void loadBase();
  }, [loadBase]);

  useEffect(() => {
    if (!debouncedSearch) {
      setSearchResults([]);
      return;
    }
    setLoadingSearch(true);
    documentsApi
      .listDocuments({ search: debouncedSearch, includeArchived: false })
      .then((results) => setSearchResults(results))
      .catch(() => setSearchResults([]))
      .finally(() => setLoadingSearch(false));
  }, [debouncedSearch]);

  const isSearching = debouncedSearch.length > 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHero
        title="Documents"
        search={
          <PageHeroSearch
            value={search}
            onChange={setSearch}
            placeholder="Search title, body, tags…"
          />
        }
      />

      {error ? <ErrorState description={error} onRetry={() => void loadBase()} /> : null}

      {isSearching ? (
        <section>
          <h2 className="text-foreground mb-3 text-lg font-semibold">Search results</h2>
          {loadingSearch ? (
            <DocListSkeleton />
          ) : searchResults.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No matching documents"
              description="Search checks titles, body text, tags and attachment names."
            />
          ) : (
            <DocumentsTable rows={searchResults} />
          )}
        </section>
      ) : (
        <Tabs defaultValue="recent">
          <TabsList>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="mt-4">
            {loadingRecent ? (
              <DocListSkeleton />
            ) : recent.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No recent documents"
                description="Documents you open or edit will appear here."
              />
            ) : (
              <DocumentsTable rows={recent} />
            )}
          </TabsContent>

          <TabsContent value="favorites" className="mt-4">
            {loadingFavorites ? (
              <DocListSkeleton />
            ) : favorites.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No favorites yet"
                description="Star a document from its page to pin it here."
              />
            ) : (
              <DocumentsTable rows={favorites} />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
