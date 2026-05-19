'use client';

import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { driveApi, type FileAsset } from '@/lib/api/drive';
import { DriveFileCard } from '@/features/drive/DriveFileCard';
import { DRIVE_LIBRARIES } from '@/features/drive/drive-options';
import { uploadDriveFilesToEntity } from '@/features/drive/drive-entity-upload';
import { findEntityFileLink } from '@/features/drive/entity-attachment-utils';

const DEAL_FILES_LIBRARY = DRIVE_LIBRARIES.find((lib) => lib.key === 'deals');
const DEAL_FILES_TILE_LIMIT = 12;

export type DealFilePurpose = 'OFFER' | 'CONTRACT';

interface DealFilesBlockProps {
  dealId: string;
  purpose: DealFilePurpose;
  emptyHint: string;
}

export function DealFilesBlock({ dealId, purpose, emptyHint }: DealFilesBlockProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [busyFileId, setBusyFileId] = useState<string | null>(null);
  const [detachTarget, setDetachTarget] = useState<FileAsset | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await driveApi.listFileAssets({
        entityType: 'DEAL',
        entityId: dealId,
        purpose,
      });
      setFiles(rows.slice(0, DEAL_FILES_TILE_LIMIT));
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [dealId, purpose]);

  useEffect(() => {
    void load();
  }, [load]);

  const uploadFiles = async (picked: File[]) => {
    if (picked.length === 0 || !DEAL_FILES_LIBRARY) return;
    setUploading(true);
    try {
      await uploadDriveFilesToEntity(
        picked,
        { entityType: 'DEAL', entityId: dealId },
        DEAL_FILES_LIBRARY,
        { purpose },
      );
      toast.success(picked.length === 1 ? 'File attached' : `${picked.length} files attached`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    void uploadFiles(Array.from(event.dataTransfer.files));
  };

  const handleDetachOnly = async () => {
    if (!detachTarget) return;
    const link = findEntityFileLink(detachTarget, 'DEAL', dealId);
    if (!link) {
      toast.error('File is not linked to this record.');
      setDetachTarget(null);
      return;
    }
    setBusyFileId(detachTarget.id);
    try {
      await driveApi.unlinkFileAsset(detachTarget.id, link.id);
      toast.success('File detached from deal');
      setDetachTarget(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not detach file');
    } finally {
      setBusyFileId(null);
    }
  };

  const handleArchive = async (file: FileAsset) => {
    setBusyFileId(file.id);
    try {
      await driveApi.archiveFileAsset(file.id);
      toast.success('File archived in Drive');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not archive file');
    } finally {
      setBusyFileId(null);
    }
  };

  const zoneBusy = uploading || loading;

  return (
    <motion className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-label={emptyHint}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => !zoneBusy && inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-7 text-center transition-colors',
          dragOver
            ? 'border-primary/50 bg-primary/5'
            : 'border-stone-200 bg-stone-50/80 hover:border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900/40 dark:hover:border-stone-600',
          zoneBusy ? 'pointer-events-none opacity-60' : '',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          onChange={(event) => {
            void uploadFiles(Array.from(event.target.files ?? []));
            event.target.value = '';
          }}
        />
        {uploading ? (
          <Loader2 className="text-muted-foreground size-8 animate-spin" aria-hidden />
        ) : (
          <Upload className="text-muted-foreground size-8 stroke-[1.25]" aria-hidden />
        )}
        <p className="text-foreground text-sm font-medium">
          {uploading ? 'Uploading…' : 'Drop files here or click to browse'}
        </p>
        <p className="text-muted-foreground max-w-xs text-xs">{emptyHint}</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading files…
        </p>
      ) : files.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {files.map((file) => (
            <DriveFileCard
              key={file.id}
              file={file}
              layout="tiles"
              selected={false}
              checked={false}
              onSelect={() => {
                const url = file.externalUrl;
                if (url) window.open(url, '_blank', 'noopener,noreferrer');
              }}
              onToggleChecked={() => undefined}
              menu={{
                busy: busyFileId === file.id,
                onOpenDetails: () => {
                  const url = file.externalUrl;
                  if (url) window.open(url, '_blank', 'noopener,noreferrer');
                },
                onUnlinkFromRecord: () => setDetachTarget(file),
                onArchive: (target) => void handleArchive(target),
                onRestore: () => undefined,
              }}
            />
          ))}
        </div>
      ) : null}

      <Dialog
        open={Boolean(detachTarget)}
        onOpenChange={(open: boolean) => {
          if (!open) setDetachTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Remove file from deal?</DialogTitle>
            <DialogDescription>
              Detach keeps the file in Drive; archive removes it from active use.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setDetachTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="secondary" onClick={() => void handleDetachOnly()}>
              Detach, keep in Drive
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!detachTarget) return;
                void handleArchive(detachTarget);
                setDetachTarget(null);
              }}
            >
              Archive file
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion>
  );
}
