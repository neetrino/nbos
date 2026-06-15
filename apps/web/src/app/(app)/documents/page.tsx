'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, FolderOpen, LayoutGrid, Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHero, PageHeroSearch, EmptyState, ErrorState } from '@/components/shared';
import {
  documentsApi,
  type DocumentListItem,
  type DocumentRecentItem,
  type DocumentSection,
} from '@/lib/api/documents';
import { getApiErrorMessage } from '@/lib/api-errors';
import { usePermission } from '@/lib/permissions';
import { useDebouncedValue } from '@/components/shared';
import { DOCUMENTS_SEARCH_DEBOUNCE_MS } from '@/features/documents/documents.constants';
import { CreateDocumentDialog } from '@/features/documents/CreateDocumentDialog';
import { DocumentsTable } from '@/features/documents/DocumentsTable';

const RECENT_DISPLAY_LIMIT = 8;
const FAVORITES_DISPLAY_LIMIT = 8;
const SECTIONS_DISPLAY_LIMIT = 6;

function SectionsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-lg" />
      ))}
    </div>
  );
}

function DocListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full rounded" />
      ))}
    </div>
  );
}

export default function DocumentsHomePage() {
  const router = useRouter();
  const { me, can } = usePermission();
  const [sections, setSections] = useState<DocumentSection[]>([]);
  const [recent, setRecent] = useState<DocumentRecentItem[]>([]);
  const [favorites, setFavorites] = useState<DocumentListItem[]>([]);
  const [drafts, setDrafts] = useState<DocumentListItem[]>([]);
  const [teamUpdated, setTeamUpdated] = useState<DocumentListItem[]>([]);
  const [searchResults, setSearchResults] = useState<DocumentListItem[]>([]);
  const [loadingBase, setLoadingBase] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, DOCUMENTS_SEARCH_DEBOUNCE_MS).trim();

  const loadBase = useCallback(async () => {
    setLoadingBase(true);
    setError(null);
    try {
      const [sec, recentList, favoriteList, draftList, latestList] = await Promise.all([
        documentsApi.listSections(),
        documentsApi.listRecent(),
        documentsApi.listFavorites(),
        documentsApi.listDocuments({ status: 'DRAFT', includeArchived: false }),
        documentsApi.listDocuments({ includeArchived: false }),
      ]);
      setSections(sec.slice(0, SECTIONS_DISPLAY_LIMIT));
      setRecent(recentList.slice(0, RECENT_DISPLAY_LIMIT));
      setFavorites(favoriteList.slice(0, FAVORITES_DISPLAY_LIMIT));
      const mine = me?.id ? draftList.filter((d) => d.createdById === me.id).slice(0, 8) : [];
      setDrafts(mine);
      setTeamUpdated(latestList.slice(0, 8));
    } catch (e) {
      setError(getApiErrorMessage(e, 'Documents could not be loaded.'));
    } finally {
      setLoadingBase(false);
    }
  }, [me?.id]);

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

  const canAdd = can('ADD', 'DOCUMENTS');
  const isSearching = debouncedSearch.length > 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHero
        title="Documents"
        search={
          <PageHeroSearch
            value={search}
            onChange={setSearch}
            placeholder="Search title, body, section, tags…"
          />
        }
        trailing={
          canAdd ? (
            <Button type="button" size="sm" className="gap-1" onClick={() => setCreateOpen(true)}>
              <Plus size={14} aria-hidden />
              New document
            </Button>
          ) : null
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
              description="Search checks titles, body text, sections, tags and attachment names."
            />
          ) : (
            <DocumentsTable rows={searchResults} />
          )}
        </section>
      ) : (
        <>
          {/* Recent */}
          <section>
            <h2 className="text-foreground mb-3 flex items-center gap-2 text-lg font-semibold">
              <FileText size={18} aria-hidden /> Recent
            </h2>
            {loadingBase ? (
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
          </section>

          {/* Favorites */}
          <section>
            <h2 className="text-foreground mb-3 flex items-center gap-2 text-lg font-semibold">
              <Star size={18} aria-hidden /> Favorites
            </h2>
            {loadingBase ? (
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
          </section>

          {/* Sections */}
          <section>
            <h2 className="text-foreground mb-3 flex items-center gap-2 text-lg font-semibold">
              <LayoutGrid size={18} aria-hidden /> Sections
            </h2>
            {loadingBase ? (
              <SectionsSkeleton />
            ) : sections.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="No sections yet"
                description="Default sections will be created on first API load."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sections.map((s) => (
                  <Link key={s.id} href={`/documents/sections/${s.id}`}>
                    <Card className="hover:border-primary/40 h-full transition-colors hover:shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <FolderOpen size={18} className="text-primary shrink-0" />
                          <span className="truncate">{s.name}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground line-clamp-2 text-sm">
                          {s.description ?? 'Open section to see documents.'}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* My drafts */}
            <section>
              <h2 className="text-foreground mb-3 text-lg font-semibold">My drafts</h2>
              {loadingBase ? (
                <DocListSkeleton />
              ) : drafts.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No drafts"
                  description={
                    canAdd
                      ? 'Drafts you create will show here.'
                      : 'You can read documents, but creating drafts is not permitted for your role.'
                  }
                />
              ) : (
                <DocumentsTable rows={drafts} />
              )}
            </section>

            {/* Recently updated by team */}
            <section>
              <h2 className="text-foreground mb-3 text-lg font-semibold">Recently updated</h2>
              {loadingBase ? (
                <DocListSkeleton />
              ) : teamUpdated.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No documents yet"
                  description={
                    canAdd
                      ? 'Create a draft to get started.'
                      : 'Documents will appear here after your team publishes them.'
                  }
                />
              ) : (
                <DocumentsTable rows={teamUpdated} />
              )}
            </section>
          </div>
        </>
      )}

      <CreateDocumentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        sections={sections}
        onCreated={(id) => router.push(`/documents/${id}`)}
      />
    </div>
  );
}
