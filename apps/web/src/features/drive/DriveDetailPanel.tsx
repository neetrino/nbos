import type { ChangeEvent, ReactNode } from 'react';
import { Archive, ArrowUpRight, Download, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { FileAsset } from '@/lib/api/drive';
import { cn } from '@/lib/utils';
import { formatDriveDate, formatDriveLabel } from './drive-format';
import { badgeVariant } from './drive-utils';

export function DriveDetailPanel({
  file,
  busy,
  onArchive,
  onRestore,
  onPreview,
  onVersionUpload,
}: {
  file: FileAsset | null;
  busy: boolean;
  onArchive: (file: FileAsset) => void;
  onRestore: (file: FileAsset) => void;
  onPreview: (file: FileAsset) => void;
  onVersionUpload: (file: FileAsset, event: ChangeEvent<HTMLInputElement>) => void;
}) {
  if (!file) {
    return (
      <aside className="border-border/70 bg-card/80 h-fit rounded-3xl border p-5">
        <p className="text-muted-foreground text-sm">
          Select a file to view metadata, business links, versions and audit.
        </p>
      </aside>
    );
  }

  return (
    <aside className="border-border/70 bg-card/80 h-fit space-y-5 rounded-3xl border p-5 xl:sticky xl:top-5">
      <FileHeading file={file} />
      <FileMetadataBadges file={file} />
      <FileActions
        file={file}
        busy={busy}
        onPreview={onPreview}
        onArchive={onArchive}
        onRestore={onRestore}
        onVersionUpload={onVersionUpload}
      />
      <BusinessLinks file={file} />
      <VersionList file={file} />
      <AuditList file={file} />
      {file.storageProvider === 'EXTERNAL_URL' && file.externalUrl && (
        <Button type="button" variant="outline" className="w-full" onClick={() => onPreview(file)}>
          <ArrowUpRight />
          Open external source
        </Button>
      )}
    </aside>
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

function FileActions({
  file,
  busy,
  onPreview,
  onArchive,
  onRestore,
  onVersionUpload,
}: {
  file: FileAsset;
  busy: boolean;
  onPreview: (file: FileAsset) => void;
  onArchive: (file: FileAsset) => void;
  onRestore: (file: FileAsset) => void;
  onVersionUpload: (file: FileAsset, event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        type="button"
        onClick={() => onPreview(file)}
        disabled={busy || file.status === 'DELETED'}
      >
        <Download />
        Open
      </Button>
      <VersionUploadLabel file={file} busy={busy} onVersionUpload={onVersionUpload} />
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => (file.status === 'ARCHIVED' ? onRestore(file) : onArchive(file))}
        className="col-span-2"
      >
        <Archive />
        {file.status === 'ARCHIVED' ? 'Restore from archive' : 'Archive safely'}
      </Button>
    </div>
  );
}

function VersionUploadLabel({
  file,
  busy,
  onVersionUpload,
}: {
  file: FileAsset;
  busy: boolean;
  onVersionUpload: (file: FileAsset, event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label
      className={cn(
        'border-border bg-background hover:bg-muted inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-medium',
        (busy || file.storageProvider !== 'R2') && 'pointer-events-none opacity-50',
      )}
    >
      <Upload className="size-4" />
      Version
      <input
        type="file"
        className="hidden"
        disabled={busy || file.storageProvider !== 'R2'}
        onChange={(event) => onVersionUpload(file, event)}
      />
    </label>
  );
}

function BusinessLinks({ file }: { file: FileAsset }) {
  return (
    <DetailSection title="Business links">
      {file.links.length === 0 ? (
        <p className="text-muted-foreground text-xs">No active entity links.</p>
      ) : (
        file.links.map((link) => (
          <div key={link.id} className="bg-muted/60 rounded-2xl px-3 py-2 text-xs">
            <div className="text-foreground font-medium">{formatDriveLabel(link.entityType)}</div>
            <div className="text-muted-foreground mt-0.5">
              {formatDriveLabel(link.linkType)} · {link.isPrimary ? 'Primary' : 'Linked'}
            </div>
          </div>
        ))
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
