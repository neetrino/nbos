'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader, EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { documentsApi, type DocumentListItem, type DocumentSection } from '@/lib/api/documents';
import { getApiErrorMessage } from '@/lib/api-errors';
import { usePermission } from '@/lib/permissions';
import { CreateDocumentDialog } from '@/features/documents/CreateDocumentDialog';
import { DocumentsTable } from '@/features/documents/DocumentsTable';

const SECTION_LIST_SCOPE_OPTIONS = [
  { value: 'ALL', label: 'Everyone (within RBAC view scope)' },
  { value: 'OWN', label: 'Owner / author only' },
  { value: 'DEPARTMENT', label: 'Author’s department colleagues' },
] as const;

export default function DocumentSectionPage() {
  const params = useParams();
  const sectionId = typeof params.sectionId === 'string' ? params.sectionId : '';
  const router = useRouter();
  const { can } = usePermission();
  const [sections, setSections] = useState<DocumentSection[]>([]);
  const [rows, setRows] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [listScope, setListScope] = useState<string>('ALL');
  const [sectionSaving, setSectionSaving] = useState(false);
  const [sectionSettingsError, setSectionSettingsError] = useState<string | null>(null);

  const section = sections.find((s) => s.id === sectionId);
  const canManageSections = can('MANAGE_SECTIONS', 'DOCUMENTS');
  const effectiveSectionScope = section?.defaultListScope ?? 'ALL';
  const sectionScopeDirty = section ? listScope !== effectiveSectionScope : false;

  useEffect(() => {
    if (section?.defaultListScope) {
      setListScope(section.defaultListScope);
    }
  }, [section?.defaultListScope]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 320);
    return () => window.clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    if (!sectionId) return;
    setLoading(true);
    setError(null);
    try {
      const q = debouncedSearch || undefined;
      const [sec, docs] = await Promise.all([
        documentsApi.listSections(),
        documentsApi.listDocuments({
          sectionId,
          includeArchived: false,
          ...(q ? { search: q } : {}),
        }),
      ]);
      setSections(sec);
      setRows(docs);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not load section documents.'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, sectionId]);

  useEffect(() => {
    load();
  }, [load]);

  const canAdd = can('ADD', 'DOCUMENTS');

  const saveSectionListScope = async () => {
    if (!sectionId || !section) return;
    setSectionSaving(true);
    setSectionSettingsError(null);
    try {
      const updated = await documentsApi.updateDocumentSection(sectionId, {
        defaultListScope: listScope,
      });
      setSections((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
    } catch (e) {
      setSectionSettingsError(getApiErrorMessage(e, 'Could not update section.'));
    } finally {
      setSectionSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <Link
          href="/documents"
          className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft size={14} /> Documents
        </Link>
        <PageHeader
          title={section?.name ?? 'Section'}
          description={section?.description ?? 'Documents in this section.'}
        >
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={load} disabled={loading}>
              <RefreshCcw size={14} /> Refresh
            </Button>
            {canAdd ? (
              <Button size="sm" className="gap-1" onClick={() => setCreateOpen(true)}>
                <Plus size={14} /> New in section
              </Button>
            ) : null}
          </div>
        </PageHeader>
      </div>

      {!loading && !error && section && canManageSections ? (
        <Card className="max-w-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Section visibility</CardTitle>
            <p className="text-muted-foreground text-sm">
              Default who can see documents in this section. RBAC{' '}
              <span className="font-mono text-xs">DOCUMENTS_VIEW</span> still applies on top.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="section-list-scope">Default list scope</Label>
                <Select value={listScope} onValueChange={(v) => setListScope(v ?? 'ALL')}>
                  <SelectTrigger id="section-list-scope" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_LIST_SCOPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={!sectionScopeDirty || sectionSaving}
                onClick={() => void saveSectionListScope()}
              >
                {sectionSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
            {sectionSettingsError ? (
              <p className="text-destructive text-sm">{sectionSettingsError}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid max-w-xl gap-2">
        <label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Search in section
        </label>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by title, body, tags…"
          aria-label="Search documents in this section"
        />
      </div>

      {loading ? <LoadingState variant="list" /> : null}
      {error ? <ErrorState description={error} onRetry={load} /> : null}

      {!loading && !error && sectionId && !section ? (
        <ErrorState
          title="Section not found"
          description="This section id is not in the library. Return to Documents home."
        />
      ) : null}

      {!loading && !error && section ? (
        <>
          {rows.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents in this section"
              description="Create a draft to populate this section."
            />
          ) : (
            <DocumentsTable rows={rows} />
          )}
        </>
      ) : null}

      <CreateDocumentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        sections={sections}
        defaultSectionId={sectionId}
        onCreated={(id) => router.push(`/documents/${id}`)}
      />
    </div>
  );
}
