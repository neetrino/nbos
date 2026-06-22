'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Archive, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHero, ErrorState, LoadingState } from '@/components/shared';
import { PAGE_TAB_BAR_WRAPPER_CLASS } from '@/components/shared/detail-sheet-classes';
import { formatDocumentActivityDetail } from '@/features/documents/document-activity-format';
import { DocumentAttachmentsPanel } from '@/features/documents/document-attachments-panel';
import { DocumentFavoriteButton } from '@/features/documents/DocumentFavoriteButton';
import { DocumentHtmlViewer } from '@/features/documents/DocumentHtmlViewer';
import { NativeDocumentEditor } from '@/features/documents/NativeDocumentEditor';
import { DocumentStatusBadge } from '@/features/documents/DocumentStatusBadge';
import { formatDocumentRelativeTime } from '@/features/documents/format-relative-time';
import { documentsApi, type DocumentActivityItem, type DocumentDetail } from '@/lib/api/documents';
import { getApiErrorMessage } from '@/lib/api-errors';
import { usePermission } from '@/lib/permissions';

const DOCUMENTS_EDIT_KEY = 'DOCUMENTS_EDIT';
const DRIVE_ADD_KEY = 'DRIVE_ADD';

type ContentTab = 'view' | 'edit';

function hasActivePermission(permissions: Record<string, string | undefined>, key: string) {
  const scope = permissions[key];
  return !!scope && scope !== 'NONE';
}

function hasDocumentsEditPermission(permissions: Record<string, string | undefined>): boolean {
  return hasActivePermission(permissions, DOCUMENTS_EDIT_KEY);
}

export default function DocumentDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const { can, permissions } = usePermission();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [olderActivity, setOlderActivity] = useState<DocumentActivityItem[]>([]);
  const [activityPagingCursor, setActivityPagingCursor] = useState<string | null>(null);
  const [activityLoadingMore, setActivityLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [contentTab, setContentTab] = useState<ContentTab>('view');

  const docRef = useRef<DocumentDetail | null>(null);
  docRef.current = doc;

  const activityLayoutKey = useMemo(() => {
    if (!doc) return '';
    const ev0 = doc.activityEvents[0];
    return `${doc.id}:${ev0?.id ?? ''}:${doc.activityEvents.length}:${doc.activityNextCursor ?? ''}`;
  }, [doc]);

  const prevActivityLayoutKeyRef = useRef('');
  useEffect(() => {
    if (!activityLayoutKey) return;
    if (prevActivityLayoutKeyRef.current === activityLayoutKey) return;
    prevActivityLayoutKeyRef.current = activityLayoutKey;
    setOlderActivity([]);
    setActivityPagingCursor(docRef.current?.activityNextCursor ?? null);
  }, [activityLayoutKey]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [next, favorites] = await Promise.all([
        documentsApi.getDocument(id),
        documentsApi.listFavorites().catch(() => []),
      ]);
      setOlderActivity([]);
      setActivityPagingCursor(next.activityNextCursor ?? null);
      setDoc(next);
      setIsFavorite(favorites.some((f) => f.id === id));
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

  const handleRestore = async () => {
    if (!id || doc?.status !== 'ARCHIVED') return;
    setRestoring(true);
    try {
      await documentsApi.restoreDocument(id);
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not restore document.'));
    } finally {
      setRestoring(false);
    }
  };

  const loadMoreActivity = async () => {
    if (!id || !activityPagingCursor) return;
    setActivityLoadingMore(true);
    try {
      const page = await documentsApi.listDocumentActivity(id, {
        cursor: activityPagingCursor,
      });
      setOlderActivity((prev) => [...prev, ...page.items]);
      setActivityPagingCursor(page.nextCursor);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not load older activity.'));
    } finally {
      setActivityLoadingMore(false);
    }
  };

  const visibleActivity =
    doc && doc.activityRevealed !== false ? [...doc.activityEvents, ...olderActivity] : [];

  const canDelete = can('DELETE', 'DOCUMENTS');
  const canEdit = can('EDIT', 'DOCUMENTS');
  const canUseDrive = hasActivePermission(permissions, DRIVE_ADD_KEY);
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
          <PageHero
            title={doc.title}
            trailing={
              <div className="flex items-center gap-2">
                {doc.status !== 'ARCHIVED' ? (
                  <DocumentFavoriteButton
                    documentId={doc.id}
                    isFavorite={isFavorite}
                    onToggled={setIsFavorite}
                  />
                ) : null}
                {canDelete && doc.status === 'ARCHIVED' ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => void handleRestore()}
                    disabled={restoring}
                  >
                    {restoring ? (
                      <Loader2 size={14} className="animate-spin" aria-hidden />
                    ) : (
                      <RotateCcw size={14} aria-hidden />
                    )}
                    Restore
                  </Button>
                ) : canDelete && doc.status !== 'ARCHIVED' ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={handleArchive}
                    disabled={archiving}
                  >
                    {archiving ? (
                      <Loader2 size={14} className="animate-spin" aria-hidden />
                    ) : (
                      <Archive size={14} aria-hidden />
                    )}
                    Archive
                  </Button>
                ) : null}
              </div>
            }
          />
          {doc.description ? (
            <p className="text-muted-foreground text-sm">{doc.description}</p>
          ) : null}

          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
            <DocumentStatusBadge status={doc.status} />
            {doc.section ? (
              <span>
                Section:{' '}
                <Link
                  href={`/documents/sections/${doc.section.id}`}
                  className="text-primary font-medium hover:underline"
                >
                  {doc.section.name}
                </Link>
              </span>
            ) : null}
            <span>Updated {formatDocumentRelativeTime(doc.updatedAt)}</span>
            {doc.publishedAt ? (
              <span>Published {formatDocumentRelativeTime(doc.publishedAt)}</span>
            ) : null}
            {doc.ownerId ? (
              <span title={doc.ownerId}>
                Owner {doc.ownerId.length > 12 ? `${doc.ownerId.slice(0, 8)}…` : doc.ownerId}
              </span>
            ) : null}
            {doc.updatedById ? (
              <span title={doc.updatedById}>
                Last edited by{' '}
                {doc.updatedById.length > 12 ? `${doc.updatedById.slice(0, 8)}…` : doc.updatedById}
              </span>
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
                  <div className={PAGE_TAB_BAR_WRAPPER_CLASS}>
                    <TabsList className="w-full justify-start">
                      <TabsTrigger value="view">Read</TabsTrigger>
                      <TabsTrigger value="edit">Edit</TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="view" className="mt-4">
                    <DocumentHtmlViewer documentId={doc.id} html={doc.contentHtml} />
                  </TabsContent>
                  <TabsContent value="edit" className="mt-4">
                    <NativeDocumentEditor
                      key={doc.id}
                      documentId={doc.id}
                      documentStatus={doc.status}
                      initialContentJson={doc.contentJson}
                      canUseDrive={canUseDrive}
                      onDocumentUpdated={setDoc}
                    />
                  </TabsContent>
                </Tabs>
              ) : (
                <DocumentHtmlViewer documentId={doc.id} html={doc.contentHtml} />
              )}
            </CardContent>
          </Card>

          {isNative ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Files</CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentAttachmentsPanel
                  documentId={doc.id}
                  attachments={doc.attachments ?? []}
                  canEdit={canEdit && doc.status !== 'ARCHIVED'}
                  canUseDrive={canUseDrive}
                  onChanged={load}
                />
                {!canUseDrive ? (
                  <p className="text-muted-foreground mt-2 text-xs">
                    Drive upload (ADD) permission is required to attach files or insert images.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {doc.activityRevealed === false ? (
                <p className="text-muted-foreground text-sm">
                  Activity history is hidden for your role.
                </p>
              ) : visibleActivity.length === 0 ? (
                <p className="text-muted-foreground text-sm">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  <ul className="divide-border divide-y text-sm">
                    {visibleActivity.map((ev) => {
                      const detail = formatDocumentActivityDetail(ev.action, ev.metadata);
                      return (
                        <li
                          key={ev.id}
                          className="flex flex-col gap-0.5 py-2 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-2"
                        >
                          <div className="min-w-0">
                            <span className="font-medium capitalize">
                              {ev.action.replace(/_/g, ' ')}
                            </span>
                            {detail ? (
                              <span className="text-muted-foreground ml-0 block text-xs sm:ml-2 sm:inline">
                                {detail}
                              </span>
                            ) : null}
                          </div>
                          <span className="text-muted-foreground shrink-0 text-xs sm:text-sm">
                            {formatDocumentRelativeTime(ev.createdAt)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {activityPagingCursor ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      disabled={activityLoadingMore}
                      onClick={() => void loadMoreActivity()}
                    >
                      {activityLoadingMore ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 size={14} className="animate-spin" /> Loading…
                        </span>
                      ) : (
                        'Load older activity'
                      )}
                    </Button>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
