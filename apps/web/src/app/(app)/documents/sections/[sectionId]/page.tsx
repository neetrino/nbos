'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader, EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { documentsApi, type DocumentListItem, type DocumentSection } from '@/lib/api/documents';
import { getApiErrorMessage } from '@/lib/api-errors';
import { usePermission } from '@/lib/permissions';
import { CreateDocumentDialog } from '@/features/documents/CreateDocumentDialog';
import { DocumentsTable } from '@/features/documents/DocumentsTable';

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

  const section = sections.find((s) => s.id === sectionId);

  const load = useCallback(async () => {
    if (!sectionId) return;
    setLoading(true);
    setError(null);
    try {
      const [sec, docs] = await Promise.all([
        documentsApi.listSections(),
        documentsApi.listDocuments({ sectionId, includeArchived: false }),
      ]);
      setSections(sec);
      setRows(docs);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not load section documents.'));
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    load();
  }, [load]);

  const canAdd = can('ADD', 'DOCUMENTS');

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
