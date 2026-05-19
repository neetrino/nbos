'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { driveApi, type FileAsset } from '@/lib/api/drive';
import { DriveFileCard } from './DriveFileCard';
import { EntityDriveQuickAttach } from './EntityDriveQuickAttach';
import type { DriveLibraryKey } from './drive-options';
import { findEntityFileLink } from './entity-attachment-utils';

const ENTITY_ATTACHMENT_TILE_LIMIT = 12;

interface EntityAttachmentBlockProps {
  entityType: string;
  entityId: string;
  libraryKey?: DriveLibraryKey;
  emptyHint?: string;
}

export function EntityAttachmentBlock({
  entityType,
  entityId,
  libraryKey = 'deals',
  emptyHint = 'Attach offer documents, contracts, or proofs.',
}: EntityAttachmentBlockProps) {
  const [files, setFiles] = useState<FileAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyFileId, setBusyFileId] = useState<string | null>(null);
  const [detachTarget, setDetachTarget] = useState<FileAsset | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await driveApi.listFileAssets({ entityType, entityId });
      setFiles(rows.slice(0, ENTITY_ATTACHMENT_TILE_LIMIT));
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDetachOnly = async () => {
    if (!detachTarget) return;
    const link = findEntityFileLink(detachTarget, entityType, entityId);
    if (!link) {
      toast.error('File is not linked to this record.');
      setDetachTarget(null);
      return;
    }
    setBusyFileId(detachTarget.id);
    try {
      await driveApi.unlinkFileAsset(detachTarget.id, link.id);
      toast.success('File detached from record');
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

  return (
    <div className="space-y-4">
      <EntityDriveQuickAttach
        entityType={entityType}
        entityId={entityId}
        libraryKey={libraryKey}
        onUploaded={() => void load()}
      />

      {loading ? (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading files…
        </p>
      ) : files.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed px-4 py-8 text-center text-sm">
          {emptyHint}
        </p>
      ) : (
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
      )}

      <Dialog
        open={Boolean(detachTarget)}
        onOpenChange={(open: boolean) => {
          if (!open) setDetachTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Remove file from record?</DialogTitle>
            <DialogDescription>
              Choose whether to keep the file in Drive or archive it completely.
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
    </div>
  );
}
