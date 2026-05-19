'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, FolderOpen, LayoutGrid, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader, EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { LIST_SEARCH_INPUT_PROPS } from '@/components/shared/list-search-input-props';
import { documentsApi, type DocumentListItem, type DocumentSection } from '@/lib/api/documents';
import { getApiErrorMessage } from '@/lib/api-errors';
import { usePermission } from '@/lib/permissions';
import { CreateDocumentDialog } from '@/features/documents/CreateDocumentDialog';
import { DocumentsTable } from '@/features/documents/DocumentsTable';

export default function DocumentsHomePage() {
  const router = useRouter();
  const { me, can } = usePermission();
  const [sections, setSections] = useState<DocumentSection[]>([]);
  const [recent, setRecent] = useState<DocumentListItem[]>([]);
  const [drafts, setDrafts] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 320);
    return () => window.clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = debouncedSearch || undefined;
      const [sec, all, draftList] = await Promise.all([
        documentsApi.listSections(),
        documentsApi.listDocuments({
          includeArchived: false,
          ...(q ? { search: q } : {}),
        }),
        documentsApi.listDocuments({
          status: 'DRAFT',
          includeArchived: false,
          ...(q ? { search: q } : {}),
        }),
      ]);
      setSections(sec);
      setRecent(all.slice(0, 12));
      const mine = me?.id ? draftList.filter((d) => d.createdById === me.id).slice(0, 12) : [];
      setDrafts(mine);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Documents could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, me?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const canAdd = can('ADD', 'DOCUMENTS');

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Documents"
        description="Company knowledge: sections, drafts, and published pages. Search matches title, description, body text, section and tag names."
      >
        <div className="flex flex-wrap items-center gap-2">
          {canAdd ? (
            <Button size="sm" className="gap-1" onClick={() => setCreateOpen(true)}>
              <Plus size={14} /> New document
            </Button>
          ) : null}
        </div>
      </PageHeader>

      <div className="grid gap-3">
        <label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Search
        </label>
        <Input
          {...LIST_SEARCH_INPUT_PROPS}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, body, section, tags…"
          className="max-w-xl"
          aria-label="Search documents"
          role="searchbox"
        />
      </div>

      {loading ? <LoadingState variant="cards" /> : null}
      {error ? <ErrorState description={error} onRetry={load} /> : null}

      {!loading && !error ? (
        <>
          <section>
            <h2 className="text-foreground mb-3 flex items-center gap-2 text-lg font-semibold">
              <LayoutGrid size={18} /> Sections
            </h2>
            {sections.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="No sections yet"
                description="Default sections will appear after the first API load."
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
            <section>
              <h2 className="text-foreground mb-3 text-lg font-semibold">Recent updates</h2>
              {recent.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title={debouncedSearch ? 'No matching documents' : 'No documents yet'}
                  description={
                    debouncedSearch
                      ? 'Search checks titles, text, sections, tags and linked attachment names.'
                      : canAdd
                        ? 'Create a draft to get started.'
                        : 'Documents will appear here after your team publishes them.'
                  }
                />
              ) : (
                <DocumentsTable rows={recent} />
              )}
            </section>
            <section>
              <h2 className="text-foreground mb-3 text-lg font-semibold">My drafts</h2>
              {drafts.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No drafts"
                  description={
                    canAdd
                      ? 'Drafts you create will show here.'
                      : 'You can read documents, but creating drafts is not allowed for your role.'
                  }
                />
              ) : (
                <DocumentsTable rows={drafts} />
              )}
            </section>
          </div>
        </>
      ) : null}

      <CreateDocumentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        sections={sections}
        onCreated={(id) => router.push(`/documents/${id}`)}
      />
    </div>
  );
}
