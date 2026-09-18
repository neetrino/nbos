'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, FileText, Loader2 } from 'lucide-react';
import { DataView, ListMutationErrorBanner } from '@/components/shared';
import { buttonVariants } from '@/components/ui/button';
import { useRevalidationState } from '@/hooks/use-revalidation-state';
import { getApiErrorMessage, isAccessRevokedApiError } from '@/lib/api-errors';
import { driveApi, type FileAsset } from '@/lib/api/drive';
import { formatDriveLabel } from './drive-format';
import { cn } from '@/lib/utils';

const ENTITY_DRIVE_FILES_PREVIEW_LIMIT = 8;

export function EntityDriveFilesPanel({
  entityType,
  entityId,
  driveHref,
  refreshKey = 0,
}: {
  entityType: string;
  entityId: string;
  driveHref: string;
  refreshKey?: number;
}) {
  const [files, setFiles] = useState<FileAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const { loading, begin: beginLoad, end: endLoad } = useRevalidationState();
  const filesRef = useRef(files);
  filesRef.current = files;
  const loadedKeyRef = useRef<string | null>(null);
  const subjectKey = `${entityType}:${entityId}`;

  const load = useCallback(async () => {
    beginLoad(loadedKeyRef.current === subjectKey && filesRef.current.length > 0);
    try {
      const rows = await driveApi.listFileAssets({ entityType, entityId });
      setFiles(rows.slice(0, ENTITY_DRIVE_FILES_PREVIEW_LIMIT));
      loadedKeyRef.current = subjectKey;
      setLoadedKey(subjectKey);
      setError(null);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Failed to load files'));
      if (isAccessRevokedApiError(caught) || loadedKeyRef.current !== subjectKey) {
        setFiles([]);
        loadedKeyRef.current = null;
        setLoadedKey(null);
      }
    } finally {
      endLoad();
    }
  }, [beginLoad, endLoad, entityId, entityType, subjectKey]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <DataView
      loading={loading}
      error={error}
      hasData={loadedKey === subjectKey}
      loadingFallback={
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading files…
        </p>
      }
      errorFallback={
        <p className="text-muted-foreground text-sm">{error ?? 'Failed to load files'}</p>
      }
    >
      <div className="space-y-3">
        {error ? (
          <ListMutationErrorBanner message={error} onDismiss={() => setError(null)} />
        ) : null}
        {files.length === 0 ? (
          <p className="text-muted-foreground text-sm">No files linked yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {files.map((file) => (
              <li
                key={file.id}
                className="bg-muted/30 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
              >
                <FileText className="text-muted-foreground size-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate font-medium">{file.displayName}</span>
                <span className="text-muted-foreground hidden shrink-0 text-xs sm:inline">
                  {file.purpose ? formatDriveLabel(file.purpose) : 'File'}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={driveHref}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'inline-flex gap-1.5')}
        >
          <ExternalLink className="size-4" aria-hidden />
          Open in Drive
        </Link>
      </div>
    </DataView>
  );
}
