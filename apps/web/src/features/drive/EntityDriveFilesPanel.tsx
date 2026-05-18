'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, FileText, Loader2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { driveApi, type FileAsset } from '@/lib/api/drive';
import { formatDriveLabel } from './drive-utils';
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
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await driveApi.listFileAssets({ entityType, entityId });
      setFiles(rows.slice(0, ENTITY_DRIVE_FILES_PREVIEW_LIMIT));
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  if (loading) {
    return (
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading files…
      </p>
    );
  }

  return (
    <div className="space-y-3">
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
  );
}
