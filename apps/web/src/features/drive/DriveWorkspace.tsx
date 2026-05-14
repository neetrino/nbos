'use client';

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { driveApi, type FileAsset } from '@/lib/api/drive';
import {
  DEFAULT_DRIVE_LIBRARY,
  DRIVE_LIBRARIES,
  DRIVE_VIEW_MODE_STORAGE_KEY,
  FALLBACK_MIME_TYPE,
  type DriveLibraryOption,
  type DriveStatusFilter,
  type DriveViewMode,
} from './drive-options';
import { BulkActionBar } from './BulkActionBar';
import { DriveDetailPanel } from './DriveDetailPanel';
import { DriveFileSurface } from './DriveFileSurface';
import { DriveHero } from './DriveHero';
import { DriveLibraries } from './DriveLibraries';
import { DriveToolbar } from './DriveToolbar';
import { ALL_PURPOSES, type PurposeFilter } from './drive-types';
import { buildDriveStats, fileMatchesLibrary, getInitialViewMode } from './drive-utils';

export function DriveWorkspace() {
  const [rawFiles, setRawFiles] = useState<FileAsset[]>([]);
  const [selectedLibrary, setSelectedLibrary] = useState<DriveLibraryOption>(DEFAULT_DRIVE_LIBRARY);
  const [selected, setSelected] = useState<FileAsset | null>(null);
  const [status, setStatus] = useState<DriveStatusFilter>('ACTIVE');
  const [purpose, setPurpose] = useState<PurposeFilter>(ALL_PURPOSES);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<DriveViewMode>(getInitialViewMode);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [insightsOpen, setInsightsOpen] = useState(false);

  const effectiveStatus = selectedLibrary.status ?? status;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await driveApi.listFileAssets({
        status: effectiveStatus,
        purpose: purpose === ALL_PURPOSES ? undefined : purpose,
        search: search || undefined,
      });
      setRawFiles(list);
      setSelectedIds((current) => current.filter((id) => list.some((file) => file.id === id)));
      setSelected((current) => list.find((file) => file.id === current?.id) ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load Drive files';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [effectiveStatus, purpose, search]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    window.localStorage.setItem(DRIVE_VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const files = useMemo(
    () => rawFiles.filter((file) => fileMatchesLibrary(file, selectedLibrary)),
    [rawFiles, selectedLibrary],
  );
  const stats = useMemo(() => buildDriveStats(files), [files]);
  const libraryCounts = useMemo(() => buildLibraryCounts(rawFiles), [rawFiles]);

  useEffect(() => {
    setSelected((current) => files.find((file) => file.id === current?.id) ?? files[0] ?? null);
  }, [files]);

  async function onPreview(file: FileAsset) {
    try {
      const { url } = await driveApi.getFileAssetPreviewUrl(file.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open file');
    }
  }

  async function onArchive(file: FileAsset) {
    await mutateFile(() => driveApi.archiveFileAsset(file.id), 'File archived');
  }

  async function onRestore(file: FileAsset) {
    await mutateFile(() => driveApi.restoreFileAsset(file.id), 'File restored');
  }

  async function onBulkArchive() {
    if (selectedIds.length === 0) return;
    await mutateFiles(
      async () => driveApi.archiveFileAssets(selectedIds),
      'Selected files archived',
    );
  }

  async function onBulkRestore() {
    if (selectedIds.length === 0) return;
    await mutateFiles(
      async () => driveApi.restoreFileAssets(selectedIds),
      'Selected files restored',
    );
  }

  async function mutateFile(action: () => Promise<FileAsset>, success: string) {
    setBusy(true);
    try {
      setSelected(await action());
      toast.success(success);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Drive action failed');
    } finally {
      setBusy(false);
    }
  }

  async function mutateFiles(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      setSelectedIds([]);
      toast.success(success);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Drive action failed');
    } finally {
      setBusy(false);
    }
  }

  function toggleChecked(file: FileAsset, checked: boolean) {
    setSelectedIds((current) => {
      const has = current.includes(file.id);
      if (checked && !has) return [...current, file.id];
      if (!checked && has) return current.filter((id) => id !== file.id);
      return current;
    });
  }

  async function onVersionUpload(file: FileAsset, event: ChangeEvent<HTMLInputElement>) {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;
    setBusy(true);
    try {
      const contentType = uploadedFile.type || FALLBACK_MIME_TYPE;
      const upload = await driveApi.createVersionUploadUrl(file.id, {
        fileName: uploadedFile.name,
        contentType,
      });
      await fetch(upload.uploadUrl, {
        method: 'PUT',
        body: uploadedFile,
        headers: { 'Content-Type': contentType },
      });
      const updated = await driveApi.completeFileVersion(file.id, {
        storageKey: upload.storageKey,
        sizeBytes: uploadedFile.size,
        changeNote: `Uploaded ${uploadedFile.name}`,
      });
      setSelected(updated);
      toast.success('New version uploaded');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Version upload failed');
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  }

  return (
    <div className="space-y-4">
      <DriveHero
        stats={stats}
        insightsOpen={insightsOpen}
        onToggleInsights={() => setInsightsOpen((current) => !current)}
        onRefresh={() => void load()}
        loading={loading}
      />

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-2xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
        <DriveLibraries
          selected={selectedLibrary}
          counts={libraryCounts}
          onSelect={(library) => {
            setSelectedLibrary(library);
            setSelectedIds([]);
          }}
        />

        <main className="min-w-0 space-y-4">
          <DriveToolbar
            library={selectedLibrary}
            search={search}
            status={status}
            purpose={purpose}
            viewMode={viewMode}
            lockedStatus={selectedLibrary.status}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
            onPurposeChange={setPurpose}
            onViewModeChange={setViewMode}
          />

          {selectedIds.length > 0 && (
            <BulkActionBar
              count={selectedIds.length}
              archived={effectiveStatus === 'ARCHIVED'}
              busy={busy}
              onArchive={() => void onBulkArchive()}
              onRestore={() => void onBulkRestore()}
              onClear={() => setSelectedIds([])}
            />
          )}

          <DriveFileSurface
            files={files}
            loading={loading}
            viewMode={viewMode}
            selectedId={selected?.id ?? null}
            checkedIds={selectedIds}
            onSelect={setSelected}
            onToggleChecked={toggleChecked}
          />
        </main>

        <DriveDetailPanel
          file={selected}
          open={Boolean(selected)}
          busy={busy}
          onClose={() => setSelected(null)}
          onArchive={(file) => void onArchive(file)}
          onRestore={(file) => void onRestore(file)}
          onPreview={(file) => void onPreview(file)}
          onVersionUpload={(file, event) => void onVersionUpload(file, event)}
        />
      </div>
    </div>
  );
}

function buildLibraryCounts(files: FileAsset[]): Map<string, number> {
  return new Map(
    DRIVE_LIBRARIES.map((library) => [
      library.key,
      files.filter((file) => fileMatchesLibrary(file, library)).length,
    ]),
  );
}
