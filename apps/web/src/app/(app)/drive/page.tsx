'use client';

import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { Archive, Download, File, Loader2, Search, Upload } from 'lucide-react';
import { driveApi, type FileAsset } from '@/lib/api/drive';

const STATUS_FILTERS = ['ACTIVE', 'APPROVED', 'ARCHIVED'] as const;
const FALLBACK_MIME_TYPE = 'application/octet-stream';

function formatSize(value: number | string | null): string {
  if (value == null) return '-';
  const bytes = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(bytes) || bytes <= 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${Number((bytes / 1024 ** power).toFixed(power > 1 ? 1 : 0))} ${units[power]}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function badgeClass(value: string): string {
  if (value.includes('SENSITIVE') || value.includes('SECRET')) {
    return 'border-red-500/30 bg-red-500/10 text-red-700';
  }
  if (value === 'CLIENT_VISIBLE' || value === 'PARTNER_VISIBLE') {
    return 'border-blue-500/30 bg-blue-500/10 text-blue-700';
  }
  return 'border-border bg-secondary text-muted-foreground';
}

function FileRow({
  file,
  selected,
  onSelect,
}: {
  file: FileAsset;
  selected: boolean;
  onSelect: (file: FileAsset) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(file)}
      className={`border-border bg-card flex w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition-all hover:shadow-sm ${
        selected ? 'ring-accent ring-2' : ''
      }`}
    >
      <div className="bg-secondary text-muted-foreground rounded-lg p-2">
        <File size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-foreground truncate text-sm font-medium">{file.displayName}</h3>
        <p className="text-muted-foreground mt-1 text-xs">
          {file.purpose ?? 'No purpose'} · {formatSize(file.sizeBytes)}
        </p>
      </div>
      <span
        className={`rounded-full border px-2 py-0.5 text-[11px] ${badgeClass(file.confidentiality)}`}
      >
        {file.confidentiality}
      </span>
      <span className="text-muted-foreground hidden w-24 text-right text-xs md:block">
        {formatDate(file.updatedAt)}
      </span>
    </button>
  );
}

function DetailDrawer({
  file,
  busy,
  onArchive,
  onPreview,
  onVersionUpload,
}: {
  file: FileAsset | null;
  busy: boolean;
  onArchive: (file: FileAsset) => void;
  onPreview: (file: FileAsset) => void;
  onVersionUpload: (file: FileAsset, event: ChangeEvent<HTMLInputElement>) => void;
}) {
  if (!file) {
    return (
      <aside className="border-border bg-card rounded-2xl border p-5">
        <p className="text-muted-foreground text-sm">
          Select a file to view metadata, links and versions.
        </p>
      </aside>
    );
  }

  return (
    <aside className="border-border bg-card space-y-5 rounded-2xl border p-5">
      <div>
        <p className="text-muted-foreground text-xs">File detail</p>
        <h2 className="text-foreground mt-1 text-lg font-semibold">{file.displayName}</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          {file.originalName ?? file.mimeType ?? 'No source name'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <span className={`rounded-lg border px-2 py-1 ${badgeClass(file.visibility)}`}>
          {file.visibility}
        </span>
        <span className={`rounded-lg border px-2 py-1 ${badgeClass(file.confidentiality)}`}>
          {file.confidentiality}
        </span>
        <span className="bg-secondary text-muted-foreground rounded-lg px-2 py-1">
          {file.status}
        </span>
        <span className="bg-secondary text-muted-foreground rounded-lg px-2 py-1">
          {file.fileType}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onPreview(file)}
          disabled={busy || file.status === 'DELETED'}
          className="bg-accent text-accent-foreground hover:bg-accent/90 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm disabled:opacity-50"
        >
          <Download size={16} />
          Open
        </button>
        <label className="border-border hover:bg-secondary inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm">
          <Upload size={16} />
          New version
          <input
            type="file"
            className="hidden"
            disabled={busy || file.storageProvider !== 'R2'}
            onChange={(event) => onVersionUpload(file, event)}
          />
        </label>
        <button
          type="button"
          onClick={() => onArchive(file)}
          disabled={busy || file.status === 'ARCHIVED'}
          className="border-border hover:bg-secondary inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm disabled:opacity-50"
        >
          <Archive size={16} />
          Archive
        </button>
      </div>

      <section>
        <h3 className="text-foreground text-sm font-semibold">Links</h3>
        <div className="mt-2 space-y-2">
          {file.links.length === 0 && (
            <p className="text-muted-foreground text-xs">No active entity links.</p>
          )}
          {file.links.map((link) => (
            <div key={link.id} className="bg-secondary rounded-lg px-3 py-2 text-xs">
              <span className="text-foreground font-medium">{link.entityType}</span>
              <span className="text-muted-foreground"> · {link.linkType}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-foreground text-sm font-semibold">Versions</h3>
        <div className="mt-2 space-y-2">
          {file.versions.map((version) => (
            <div key={version.id} className="border-border rounded-lg border px-3 py-2 text-xs">
              <div className="flex justify-between">
                <span className="text-foreground font-medium">v{version.versionNumber}</span>
                <span className="text-muted-foreground">
                  {version.isCurrent ? 'Current' : formatDate(version.uploadedAt)}
                </span>
              </div>
              {version.changeNote && (
                <p className="text-muted-foreground mt-1">{version.changeNote}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-foreground text-sm font-semibold">Audit</h3>
        <div className="mt-2 space-y-2">
          {(file.auditEvents ?? []).slice(0, 5).map((event) => (
            <div key={event.id} className="text-muted-foreground text-xs">
              {event.action} · {formatDate(event.createdAt)}
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}

export default function DrivePage() {
  const [files, setFiles] = useState<FileAsset[]>([]);
  const [selected, setSelected] = useState<FileAsset | null>(null);
  const [status, setStatus] = useState<string>('ACTIVE');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await driveApi.listFileAssets({ status, search: search || undefined });
      setFiles(list);
      setSelected((current) => list.find((file) => file.id === current?.id) ?? list[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Drive files');
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onPreview(file: FileAsset) {
    const { url } = await driveApi.getFileAssetPreviewUrl(file.id);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function onArchive(file: FileAsset) {
    setBusy(true);
    try {
      const updated = await driveApi.archiveFileAsset(file.id);
      setSelected(updated);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function onVersionUpload(file: FileAsset, event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    setBusy(true);
    try {
      const contentType = selectedFile.type || FALLBACK_MIME_TYPE;
      const upload = await driveApi.createVersionUploadUrl(file.id, {
        fileName: selectedFile.name,
        contentType,
      });
      await fetch(upload.uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: { 'Content-Type': contentType },
      });
      const updated = await driveApi.completeFileVersion(file.id, {
        storageKey: upload.storageKey,
        sizeBytes: selectedFile.size,
        changeNote: `Uploaded ${selectedFile.name}`,
      });
      setSelected(updated);
      await load();
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <main className="min-w-0 space-y-5">
        <div>
          <p className="text-muted-foreground text-sm">Drive</p>
          <h1 className="text-foreground text-2xl font-semibold">File Assets</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            DB-backed library with links, versions and audit.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-4 md:flex-row">
          <div className="relative flex-1">
            <Search
              className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
              size={16}
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search file assets..."
              className="border-input bg-background w-full rounded-xl border py-2.5 pr-4 pl-10 text-sm outline-none"
            />
          </div>
          <div className="flex gap-2">
            {STATUS_FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStatus(item)}
                className={`rounded-xl px-3 py-2 text-xs font-medium ${
                  status === item
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="text-muted-foreground animate-spin" size={28} />
          </div>
        ) : files.length === 0 ? (
          <div className="border-border rounded-2xl border border-dashed py-16 text-center">
            <File className="text-muted-foreground/40 mx-auto" size={36} />
            <h2 className="text-foreground mt-3 font-semibold">No file assets</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Upload from a linked module to create Drive assets.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                selected={file.id === selected?.id}
                onSelect={setSelected}
              />
            ))}
          </div>
        )}
      </main>

      <DetailDrawer
        file={selected}
        busy={busy}
        onArchive={(file) => void onArchive(file)}
        onPreview={(file) => void onPreview(file)}
        onVersionUpload={(file, event) => void onVersionUpload(file, event)}
      />
    </div>
  );
}
