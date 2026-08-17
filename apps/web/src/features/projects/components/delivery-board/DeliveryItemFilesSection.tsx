'use client';

import { useCallback, useState } from 'react';
import { ExternalLink, File } from 'lucide-react';
import { toast } from 'sonner';
import { DETAIL_SHEET_SECTION_TITLE_CLASS } from '@/components/shared';
import { SheetFileAttachments } from '@/components/shared/SheetFileAttachments';
import { DRIVE_LIBRARIES } from '@/features/drive/drive-options';
import type { DriveFileCardMenuHandlers } from '@/features/drive/DriveFileCard';
import {
  moveToTrashAndUnlinkFileFromEntityRecord,
  unlinkFileFromEntityRecord,
} from '@/features/drive/entity-attachment-record-actions';
import { useOptimisticEntityFileUpload } from '@/features/drive/use-optimistic-entity-file-upload';
import { driveApi, type FileAsset } from '@/lib/api/drive';
import { cn } from '@/lib/utils';

const DELIVERY_ITEM_ATTACHMENT_PURPOSE = 'DELIVERY_FILE';

function resolveProductsLibrary() {
  const library = DRIVE_LIBRARIES.find((item) => item.key === 'products');
  if (!library) {
    throw new Error('Drive library configuration missing required "products" entry.');
  }
  return library;
}

const PRODUCTS_FILES_LIBRARY = resolveProductsLibrary();

function DealFileButton({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="border-border bg-background/60 hover:bg-muted/30 flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
    >
      <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
        <File size={18} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="text-muted-foreground truncate text-xs">Open in new tab</p>
      </div>
      <ExternalLink className="text-muted-foreground size-4 shrink-0" aria-hidden />
    </a>
  );
}

interface DeliveryItemFilesSectionProps {
  kind: 'PRODUCT' | 'EXTENSION';
  entityId: string;
  offerFileUrl?: string | null;
  contractFileUrl?: string | null;
  disabled?: boolean;
}

export function DeliveryItemFilesSection({
  kind,
  entityId,
  offerFileUrl = null,
  contractFileUrl = null,
  disabled = false,
}: DeliveryItemFilesSectionProps) {
  const [busyFileId, setBusyFileId] = useState<string | null>(null);
  const offer = offerFileUrl?.trim() || null;
  const contract = contractFileUrl?.trim() || null;
  const hasDealFiles = Boolean(offer || contract);

  const listFiles = useCallback(async () => {
    return driveApi.listFileAssets({
      entityType: kind,
      entityId,
      purpose: DELIVERY_ITEM_ATTACHMENT_PURPOSE,
    });
  }, [entityId, kind]);

  const { files, pending, loading, uploadFiles, refresh } = useOptimisticEntityFileUpload({
    link: { entityType: kind, entityId },
    library: PRODUCTS_FILES_LIBRARY,
    purpose: DELIVERY_ITEM_ATTACHMENT_PURPOSE,
    listFiles,
  });

  const runUnlink = async (file: FileAsset) => {
    setBusyFileId(file.id);
    try {
      await unlinkFileFromEntityRecord(file, kind, entityId);
      toast.success('Unlinked — file stays in the product folder on Drive');
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not unlink file');
    } finally {
      setBusyFileId(null);
    }
  };

  const runMoveToTrash = async (file: FileAsset) => {
    setBusyFileId(file.id);
    try {
      await moveToTrashAndUnlinkFileFromEntityRecord(file, kind, entityId);
      toast.success('File moved to Trash and unlinked');
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not move file to Trash');
    } finally {
      setBusyFileId(null);
    }
  };

  const fileMenu = (file: FileAsset): DriveFileCardMenuHandlers => ({
    busy: busyFileId === file.id,
    onOpenDetails: () => {
      const url = file.externalUrl;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    },
    onUnlinkFromRecord: () => void runUnlink(file),
    onMoveToTrash: (target) => void runMoveToTrash(target),
    onRestore: () => undefined,
  });

  const readOnlyMenu = (file: FileAsset): DriveFileCardMenuHandlers => ({
    busy: false,
    onOpenDetails: () => {
      const url = file.externalUrl;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    },
    onUnlinkFromRecord: () => undefined,
    onMoveToTrash: () => undefined,
    onRestore: () => undefined,
  });

  return (
    <section className="border-border bg-card rounded-xl border p-4 shadow-sm">
      <h3 className={cn(DETAIL_SHEET_SECTION_TITLE_CLASS, 'mb-3')}>
        <File size={13} aria-hidden />
        Files
      </h3>

      <div className="flex flex-col gap-4">
        {hasDealFiles ? (
          <div className="flex flex-col gap-1.5">
            {offer ? <DealFileButton label="Approved offer" href={offer} /> : null}
            {contract ? <DealFileButton label="Contract" href={contract} /> : null}
          </div>
        ) : null}

        <SheetFileAttachments
          files={files}
          pendingUploads={pending}
          loading={loading}
          denseTiles
          embedded
          sectionTitle="Attachments"
          emptyHint="You can drag a file here or click + to browse"
          onUpload={async (picked) => {
            if (disabled) return;
            await uploadFiles(picked);
          }}
          onOpenFile={(file) => {
            const url = file.externalUrl;
            if (url) window.open(url, '_blank', 'noopener,noreferrer');
          }}
          fileMenu={(file) => (disabled ? readOnlyMenu(file) : fileMenu(file))}
        />
      </div>
    </section>
  );
}
