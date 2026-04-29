'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Archive, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader, ErrorState, LoadingState } from '@/components/shared';
import { DocumentHtmlViewer } from '@/features/documents/DocumentHtmlViewer';
import { NativeDocumentEditor } from '@/features/documents/NativeDocumentEditor';
import { DocumentStatusBadge } from '@/features/documents/DocumentStatusBadge';
import { formatDocumentRelativeTime } from '@/features/documents/format-relative-time';
import { documentsApi, type DocumentDetail } from '@/lib/api/documents';
import { getApiErrorMessage } from '@/lib/api-errors';
import { usePermission } from '@/lib/permissions';

const DOCUMENTS_EDIT_KEY = 'DOCUMENTS_EDIT';

type ContentTab = 'view' | 'edit';

function hasDocumentsEditPermission(permissions: Record<string, string | undefined>): boolean {
  const scope = permissions[DOCUMENTS_EDIT_KEY];
  return !!scope && scope !== 'NONE';
}

export default function DocumentDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const { can, permissions } = usePermission();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [contentTab, setContentTab] = useState<ContentTab>('view');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const next = await documentsApi.getDocument(id);
      setDoc(next);
      const canEditDoc = hasDocumentsEditPermission(permissions);
      setContentTab(next.status === 'DRAFT' && canEditDoc ? 'edit' : 'view');
    } catch (e) {
      setError(getApiErrorMessage(e, 'Document could not be loaded.'));
      setDoc(null);
    } finally {
      setLoading(false);
    }
  }, [id, permissions]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleArchive = async () => {
    if (!id || doc?.status === 'ARCHIVED') return;
    setArchiving(true);
    try {
      await documentsApi.archiveDocument(id);
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not archive document.'));
    } finally {
      setArchiving(false);
    }
  };

  const canDelete = can('DELETE', 'DOCUMENTS');
  const canEdit = can('EDIT', 'DOCUMENTS');
  const isNative = doc?.type === 'NATIVE';
  const showEditorTabs = isNative && canEdit && doc && doc.status !== 'ARCHIVED';

  return (
    <div className="flex flex-col gap-6 p-6">
      <Link
        href="/documents"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft size={14} /> Documents
      </Link>

      {loading ? <LoadingState variant="list" count={3} /> : null}
      {error && !doc ? <ErrorState description={error} onRetry={load} /> : null}

      {doc ? (
        <>
          <PageHeader title={doc.title} description={doc.description ?? undefined}>
            {canDelete && doc.status !== 'ARCHIVED' ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={handleArchive}
                disabled={archiving}
              >
                {archiving ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />}
                Archive
              </Button>
            ) : null}
          </PageHeader>

          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
            <DocumentStatusBadge status={doc.status} />
            <span>
              Section:{' '}
              <Link
                href={`/documents/sections/${doc.section.id}`}
                className="text-primary font-medium hover:underline"
              >
                {doc.section.name}
              </Link>
            </span>
            <span>Updated {formatDocumentRelativeTime(doc.updatedAt)}</span>
            {doc.publishedAt ? (
              <span>Published {formatDocumentRelativeTime(doc.publishedAt)}</span>
            ) : null}
          </div>

          {error ? <ErrorState description={error} onRetry={load} /> : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isNative ? (
                <p className="text-muted-foreground text-sm">
                  The rich editor is available for native documents only. This document uses another
                  type.
                </p>
              ) : showEditorTabs ? (
                <Tabs
                  value={contentTab}
                  onValueChange={(v) => setContentTab(v as ContentTab)}
                  className="w-full"
                >
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="view">Read</TabsTrigger>
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                  </TabsList>
                  <TabsContent value="view" className="mt-4">
                    <DocumentHtmlViewer html={doc.contentHtml} />
                  </TabsContent>
                  <TabsContent value="edit" className="mt-4">
                    <NativeDocumentEditor
                      key={doc.id}
                      documentId={doc.id}
                      documentStatus={doc.status}
                      initialContentJson={doc.contentJson}
                      onDocumentUpdated={setDoc}
                    />
                  </TabsContent>
                </Tabs>
              ) : (
                <DocumentHtmlViewer html={doc.contentHtml} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {doc.activityEvents.length === 0 ? (
                <p className="text-muted-foreground text-sm">No activity yet.</p>
              ) : (
                <ul className="divide-border divide-y text-sm">
                  {doc.activityEvents.map((ev) => (
                    <li
                      key={ev.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 py-2"
                    >
                      <span className="font-medium capitalize">{ev.action.replace(/_/g, ' ')}</span>
                      <span className="text-muted-foreground">
                        {formatDocumentRelativeTime(ev.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
