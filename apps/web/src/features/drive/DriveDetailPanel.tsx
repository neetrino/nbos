import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Archive,
  ArrowUpRight,
  Copy,
  File,
  FolderInput,
  Link2Off,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  EntityDetailSheetContent,
  ENTITY_SHEET_FLOATING_RAIL_CONTROL_CLASS,
  ENTITY_SHEET_FLOATING_RAIL_HINT_CLASS,
} from '@/components/shared';
import { Sheet } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { driveApi } from '@/lib/api/drive';
import type { FileAsset } from '@/lib/api/drive';
import { cn } from '@/lib/utils';
import { formatFileSize } from './drive-format';
import { formatDriveDate, formatDriveLabel } from './drive-format';
import { badgeVariant } from './drive-utils';
import { getDriveFileLinkEntityHref } from './drive-file-link-entity-href';
import { buildDriveFileHref } from './drive-file-links';
import { FileDriveGrantsSection } from './file-drive-grants-section';
import type { DriveFileActionGates } from './drive-file-allowed-actions';

export function DriveDetailPanel({
  file,
  open,
  busy,
  onClose,
  onArchive,
  onRestore,
  onPreview,
  onCopyFile,
  onMoveFile,
  onRemoveFromFolder,
  onUnlinkFromRecord,
  onVersionUpload,
  onFileDetailRefresh,
  onPermanentDeleteSuccess,
  fileActionGates,
}: {
  file: FileAsset | null;
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onArchive: (file: FileAsset) => void;
  onRestore: (file: FileAsset) => void;
  onPreview: (file: FileAsset) => void;
  onCopyFile?: (file: FileAsset) => void;
  onMoveFile?: (file: FileAsset) => void;
  onRemoveFromFolder?: (file: FileAsset) => void;
  onUnlinkFromRecord?: (file: FileAsset) => void;
  onVersionUpload: (file: FileAsset, event: ChangeEvent<HTMLInputElement>) => void;
  /** Refetch file list / detail after grants or similar mutations. */
  onFileDetailRefresh?: () => void;
  /** After permanent delete: refresh list and close sheet. */
  onPermanentDeleteSuccess?: () => void;
  fileActionGates: DriveFileActionGates;
}) {
  return (
    <Sheet open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <EntityDetailSheetContent
        open={open}
        contentClassName="w-full gap-0 overflow-hidden p-0 sm:max-w-none sm:data-[side=right]:w-[82vw]"
        railAnchorClassName="sm:right-[82vw]"
        showRailActions={Boolean(file)}
        sourcePageHref={file ? buildDriveFileHref(file.id) : '#'}
        trailingRail={
          file ? (
            <DriveFileRailTrailing
              file={file}
              busy={busy}
              onArchive={onArchive}
              onRestore={onRestore}
              onCopyFile={onCopyFile}
              onMoveFile={onMoveFile}
              onRemoveFromFolder={onRemoveFromFolder}
              onUnlinkFromRecord={onUnlinkFromRecord}
              onVersionUpload={onVersionUpload}
              onPermanentDeleteSuccess={onPermanentDeleteSuccess}
              fileActionGates={fileActionGates}
            />
          ) : undefined
        }
      >
        {file && (
          <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
            <FilePreviewPane file={file} />
            <aside className="border-border bg-background min-h-0 overflow-y-auto border-l">
              <FileInfoPanel
                file={file}
                onPreview={onPreview}
                onFileDetailRefresh={onFileDetailRefresh}
                fileActionGates={fileActionGates}
              />
            </aside>
          </div>
        )}
      </EntityDetailSheetContent>
    </Sheet>
  );
}

function DriveFileRailTrailing({
  file,
  busy,
  onArchive,
  onRestore,
  onCopyFile,
  onMoveFile,
  onRemoveFromFolder,
  onUnlinkFromRecord,
  onVersionUpload,
  onPermanentDeleteSuccess,
  fileActionGates,
}: {
  file: FileAsset;
  busy: boolean;
  onArchive: (file: FileAsset) => void;
  onRestore: (file: FileAsset) => void;
  onCopyFile?: (file: FileAsset) => void;
  onMoveFile?: (file: FileAsset) => void;
  onRemoveFromFolder?: (file: FileAsset) => void;
  onUnlinkFromRecord?: (file: FileAsset) => void;
  onVersionUpload: (file: FileAsset, event: ChangeEvent<HTMLInputElement>) => void;
  onPermanentDeleteSuccess?: () => void;
  fileActionGates: DriveFileActionGates;
}) {
  const isArchived = file.status === 'ARCHIVED';
  const isTrash = file.status === 'DELETED';
  const archiveLabel = isTrash || isArchived ? 'Restore file' : 'Archive file';
  const archiveHint = isTrash || isArchived ? 'Restore' : 'Archive';
  const showArchiveControl = fileActionGates.canArchive || fileActionGates.canRestore;

  async function handleMoveToTrash() {
    const linkCount = file.links.filter((link) => link.unlinkedAt == null).length;
    const msg =
      linkCount > 0
        ? `This file has ${linkCount} active business link(s). Remove links first, or the server will reject the move. Move to Trash anyway?`
        : 'Move this file to Trash? You can restore it from Trash later.';
    if (!window.confirm(msg)) return;
    try {
      await driveApi.permanentlyDeleteFileAsset(file.id);
      toast.success('File moved to Trash');
      onPermanentDeleteSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Move to Trash failed');
    }
  }

  return (
    <>
      {fileActionGates.canUploadVersion ? (
        <RailVersionUpload file={file} busy={busy} onVersionUpload={onVersionUpload} />
      ) : null}
      {showArchiveControl ? (
        <RailTrailButton
          ariaLabel={archiveLabel}
          hint={archiveHint}
          disabled={busy}
          onClick={() => (isTrash || isArchived ? onRestore(file) : onArchive(file))}
        >
          <Archive className="size-4" aria-hidden />
        </RailTrailButton>
      ) : null}
      {isArchived && fileActionGates.canMoveToTrash ? (
        <RailTrailButton
          ariaLabel="Move to Trash"
          hint="Move to Trash"
          disabled={busy}
          onClick={() => void handleMoveToTrash()}
        >
          <Trash2 className="size-4" aria-hidden />
        </RailTrailButton>
      ) : null}
      {onCopyFile && fileActionGates.canCopy ? (
        <RailTrailButton
          ariaLabel="Copy file"
          hint="Copy"
          disabled={busy}
          onClick={() => onCopyFile(file)}
        >
          <Copy className="size-4" aria-hidden />
        </RailTrailButton>
      ) : null}
      {onMoveFile && fileActionGates.canMove ? (
        <RailTrailButton
          ariaLabel="Move file in folder tree"
          hint="Move"
          disabled={busy}
          onClick={() => onMoveFile(file)}
        >
          <FolderInput className="size-4" aria-hidden />
        </RailTrailButton>
      ) : null}
      {onRemoveFromFolder && fileActionGates.canRemovePlacement ? (
        <RailTrailButton
          ariaLabel="Remove from folder"
          hint="Remove"
          disabled={busy}
          onClick={() => onRemoveFromFolder(file)}
        >
          <File className="size-4" aria-hidden />
        </RailTrailButton>
      ) : null}
      {onUnlinkFromRecord && fileActionGates.canUnlink ? (
        <RailTrailButton
          ariaLabel="Unlink"
          hint="Unlink"
          disabled={busy}
          onClick={() => onUnlinkFromRecord(file)}
        >
          <Link2Off className="size-4" aria-hidden />
        </RailTrailButton>
      ) : null}
    </>
  );
}

function RailTrailButton({
  ariaLabel,
  hint,
  disabled,
  onClick,
  children,
}: {
  ariaLabel: string;
  hint: string;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="default"
      size="icon"
      className={ENTITY_SHEET_FLOATING_RAIL_CONTROL_CLASS}
      aria-label={ariaLabel}
      title={hint}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
      <span className={ENTITY_SHEET_FLOATING_RAIL_HINT_CLASS}>{hint}</span>
    </Button>
  );
}

function RailVersionUpload({
  file,
  busy,
  onVersionUpload,
}: {
  file: FileAsset;
  busy: boolean;
  onVersionUpload: (file: FileAsset, event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const disabled = busy || file.storageProvider !== 'R2';
  return (
    <label
      className={cn(
        ENTITY_SHEET_FLOATING_RAIL_CONTROL_CLASS,
        'inline-flex cursor-pointer items-center justify-center',
        disabled && 'pointer-events-none opacity-50',
      )}
      title="Upload"
      aria-label="Upload new version"
    >
      <Upload className="size-4" aria-hidden />
      <span className={ENTITY_SHEET_FLOATING_RAIL_HINT_CLASS}>Upload</span>
      <input
        type="file"
        className="hidden"
        disabled={disabled}
        onChange={(event) => onVersionUpload(file, event)}
      />
    </label>
  );
}

function FilePreviewPane({ file }: { file: FileAsset }) {
  const [preview, setPreview] = useState<{
    fileId: string;
    url: string;
    mimeType: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    driveApi.getFileAssetPreviewUrl(file.id).then((result) => {
      if (!cancelled) setPreview({ fileId: file.id, ...result });
    });
    return () => {
      cancelled = true;
    };
  }, [file.id]);

  const activePreview = preview?.fileId === file.id ? preview : null;

  return (
    <main className="bg-muted/40 flex min-h-0 items-center justify-center p-6">
      <PreviewContent file={file} preview={activePreview} loading={!activePreview} />
    </main>
  );
}

function CodeTextPreview({ url, title }: { url: string; title: string }) {
  const [body, setBody] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Preview fetch failed');
        return res.text();
      })
      .then((raw) => {
        const max = 200_000;
        const clipped = raw.length > max ? `${raw.slice(0, max)}\n…(truncated)` : raw;
        if (!cancelled) setBody(clipped);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (failed) {
    return (
      <p className="text-muted-foreground max-w-md text-center text-sm">
        In-browser preview failed (CORS or size). Use &quot;Open file&quot; from the file menu.
      </p>
    );
  }
  if (body === null) {
    return (
      <Loader2
        className="text-muted-foreground size-8 animate-spin"
        aria-label={`Loading ${title}`}
      />
    );
  }
  return (
    <pre
      className="bg-background border-border max-h-[min(70vh,560px)] w-full max-w-full overflow-auto rounded-2xl border p-4 text-left font-mono text-xs leading-relaxed whitespace-pre-wrap"
      tabIndex={0}
    >
      {body}
    </pre>
  );
}

function PreviewContent({
  file,
  preview,
  loading,
}: {
  file: FileAsset;
  preview: { url: string; mimeType: string | null } | null;
  loading: boolean;
}) {
  if (loading) {
    return <Loader2 className="text-muted-foreground size-8 animate-spin" />;
  }
  if (!preview?.url) return <PreviewFallback file={file} />;
  const mimeType = preview.mimeType ?? file.mimeType ?? '';
  const isCodeLike =
    file.fileType === 'CODE' ||
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType.includes('javascript') ||
    mimeType.includes('typescript');
  if (mimeType.startsWith('image/')) {
    return (
      <img
        src={preview.url}
        alt={file.displayName}
        className="max-h-full max-w-full rounded-2xl object-contain shadow-sm"
      />
    );
  }
  if (mimeType.startsWith('video/')) {
    return (
      <video
        controls
        className="max-h-full max-w-full rounded-2xl shadow-sm"
        src={preview.url}
        aria-label={file.displayName}
      />
    );
  }
  if (isCodeLike) {
    return <CodeTextPreview url={preview.url} title={file.displayName} />;
  }
  if (mimeType === 'application/pdf') {
    return (
      <div className="flex h-full min-h-[min(70vh,560px)] w-full max-w-full flex-col gap-2">
        <iframe
          title={file.displayName}
          src={preview.url}
          className="bg-background min-h-0 w-full flex-1 rounded-2xl border"
        />
        <p className="text-muted-foreground text-center text-xs">
          Large PDFs:{' '}
          <button
            type="button"
            className={cn(buttonVariants({ variant: 'link' }), 'h-auto p-0 text-xs')}
            onClick={() => window.open(preview.url, '_blank', 'noopener,noreferrer')}
          >
            Open in new tab
          </button>{' '}
          if the embedded viewer is slow.
        </p>
      </div>
    );
  }
  return <PreviewFallback file={file} previewUrl={preview.url} />;
}

function PreviewFallback({ file, previewUrl }: { file: FileAsset; previewUrl?: string }) {
  return (
    <div className="border-border bg-background max-w-md rounded-3xl border p-8 text-center shadow-sm">
      <File className="text-muted-foreground mx-auto size-12" />
      <h2 className="text-foreground mt-4 text-lg font-semibold">{file.displayName}</h2>
      <p className="text-muted-foreground mt-2 text-sm">
        Preview is not available for this file type. Open it in a new tab or copy the file link.
      </p>
      {previewUrl ? (
        <Button
          className="mt-5"
          onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
        >
          <ArrowUpRight />
          Open file
        </Button>
      ) : null}
    </div>
  );
}

function FileInfoPanel({
  file,
  onPreview,
  onFileDetailRefresh,
  fileActionGates,
}: {
  file: FileAsset;
  onPreview: (file: FileAsset) => void;
  onFileDetailRefresh?: () => void;
  fileActionGates: DriveFileActionGates;
}) {
  return (
    <div className="space-y-5 p-5">
      <FileHeading file={file} />
      <FileMetadataBadges file={file} />
      <FileFacts file={file} />
      <BusinessLinks file={file} />
      {fileActionGates.canShare ? (
        <FileDriveGrantsSection file={file} onChanged={onFileDetailRefresh} />
      ) : (
        <DetailSection title="Access">
          <p className="text-muted-foreground text-xs">
            You do not have permission to manage sharing on this file.
          </p>
        </DetailSection>
      )}
      <VersionList file={file} />
      <AuditList file={file} />
      {file.storageProvider === 'EXTERNAL_URL' && file.externalUrl && (
        <Button type="button" variant="outline" className="w-full" onClick={() => onPreview(file)}>
          <ArrowUpRight />
          Open external source
        </Button>
      )}
    </div>
  );
}

function FileHeading({ file }: { file: FileAsset }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">File detail</p>
      <h2 className="text-foreground mt-1 text-lg font-semibold">{file.displayName}</h2>
      <p className="text-muted-foreground mt-1 text-xs">
        {file.originalName ?? file.mimeType ?? 'No source name'}
      </p>
    </div>
  );
}

function FileMetadataBadges({ file }: { file: FileAsset }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Badge variant={badgeVariant(file.visibility)}>{formatDriveLabel(file.visibility)}</Badge>
      <Badge variant={badgeVariant(file.confidentiality)}>
        {formatDriveLabel(file.confidentiality)}
      </Badge>
      <Badge variant={badgeVariant(file.status)}>{formatDriveLabel(file.status)}</Badge>
      <Badge variant="outline">{formatDriveLabel(file.fileType)}</Badge>
    </div>
  );
}

function FileFacts({ file }: { file: FileAsset }) {
  return (
    <div className="bg-muted/50 grid grid-cols-2 gap-3 rounded-2xl p-3 text-xs">
      <Fact label="Size" value={formatFileSize(file.sizeBytes)} />
      <Fact label="Updated" value={formatDriveDate(file.updatedAt)} />
      <Fact label="Source" value={file.sourceModule ?? 'Not set'} />
      <Fact label="Storage" value={formatDriveLabel(file.storageProvider)} />
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="text-foreground mt-1 truncate font-medium">{value}</div>
    </div>
  );
}

function BusinessLinks({ file }: { file: FileAsset }) {
  return (
    <DetailSection title="Business links">
      {file.links.length === 0 ? (
        <p className="text-muted-foreground text-xs">No active entity links.</p>
      ) : (
        file.links.map((link) => {
          const href = getDriveFileLinkEntityHref(link, file.links);
          return (
            <div
              key={link.id}
              className="bg-muted/60 flex flex-col gap-2 rounded-2xl px-3 py-2 text-xs sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="text-foreground font-medium">
                  {formatDriveLabel(link.entityType)}
                </div>
                <div className="text-muted-foreground mt-0.5">
                  {formatDriveLabel(link.linkType)} · {link.isPrimary ? 'Primary' : 'Linked'}
                </div>
              </div>
              {href ? (
                <Link
                  href={href}
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'shrink-0 self-start sm:self-center',
                  )}
                  aria-label={`Open linked ${formatDriveLabel(link.entityType)}`}
                >
                  Open
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              ) : null}
            </div>
          );
        })
      )}
    </DetailSection>
  );
}

function VersionList({ file }: { file: FileAsset }) {
  return (
    <DetailSection title="Versions">
      {file.versions.map((version) => (
        <div key={version.id} className="border-border rounded-2xl border px-3 py-2 text-xs">
          <div className="flex justify-between">
            <span className="text-foreground font-medium">v{version.versionNumber}</span>
            <span className="text-muted-foreground">
              {version.isCurrent ? 'Current' : formatDriveDate(version.uploadedAt)}
            </span>
          </div>
          {version.changeNote && (
            <p className="text-muted-foreground mt-1 line-clamp-2">{version.changeNote}</p>
          )}
        </div>
      ))}
    </DetailSection>
  );
}

function AuditList({ file }: { file: FileAsset }) {
  const events = (file.auditEvents ?? []).slice(0, 5);
  return (
    <DetailSection title="Recent audit">
      {events.length === 0 ? (
        <p className="text-muted-foreground text-xs">No audit events yet.</p>
      ) : (
        events.map((event) => (
          <div key={event.id} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-foreground">{formatDriveLabel(event.action)}</span>
            <span className="text-muted-foreground">{formatDriveDate(event.createdAt)}</span>
          </div>
        ))
      )}
    </DetailSection>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-foreground text-sm font-semibold">{title}</h3>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
