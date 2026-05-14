'use client';

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import {
  driveApi,
  type DriveFolder,
  type DriveFolderListing,
  type FileAsset,
} from '@/lib/api/drive';
import {
  DEFAULT_DRIVE_SPACE,
  DEFAULT_DRIVE_LIBRARY,
  DRIVE_LIBRARIES,
  DRIVE_VIEW_MODE_STORAGE_KEY,
  FALLBACK_MIME_TYPE,
  type DriveLibraryOption,
  type DriveSpaceOption,
  type DriveStatusFilter,
  type DriveViewMode,
} from './drive-options';
import { BulkActionBar } from './BulkActionBar';
import { DriveDetailPanel } from './DriveDetailPanel';
import { DriveFileSurface } from './DriveFileSurface';
import { DriveHero } from './DriveHero';
import { DriveLibraries } from './DriveLibraries';
import { DriveToolbar } from './DriveToolbar';
import { buildDriveFileAbsoluteUrl } from './drive-file-links';
import { ALL_PURPOSES, type PurposeFilter } from './drive-types';
import {
  buildDriveStats,
  buildLibraryCounts,
  fileMatchesLibrary,
  getInitialViewMode,
} from './drive-utils';

export function DriveWorkspace() {
  const [rawFiles, setRawFiles] = useState<FileAsset[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<DriveSpaceOption>(DEFAULT_DRIVE_SPACE);
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
  const [folderListing, setFolderListing] = useState<DriveFolderListing | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [folderTrail, setFolderTrail] = useState<DriveFolder[]>([]);

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

  const freeDriveSpace =
    selectedLibrary.key === 'company'
      ? 'COMPANY'
      : selectedLibrary.key === 'personal'
        ? 'PERSONAL'
        : null;

  useEffect(() => {
    setActiveFolderId(null);
    setFolderTrail([]);
  }, [selectedLibrary.key]);

  const loadFolders = useCallback(async () => {
    if (!freeDriveSpace) {
      setFolderListing(null);
      setActiveFolderId(null);
      setFolderTrail([]);
      return;
    }
    try {
      const listing = await driveApi.listFolder({
        space: freeDriveSpace,
        parentId: activeFolderId,
      });
      setFolderListing(listing);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load Drive folder');
    }
  }, [activeFolderId, freeDriveSpace]);

  useEffect(() => {
    void loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    window.localStorage.setItem(DRIVE_VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const files = useMemo(
    () =>
      folderListing
        ? folderListing.files
        : rawFiles.filter((file) => fileMatchesLibrary(file, selectedLibrary)),
    [folderListing, rawFiles, selectedLibrary],
  );
  const stats = useMemo(() => buildDriveStats(files), [files]);
  const libraryCounts = useMemo(() => buildLibraryCounts(rawFiles), [rawFiles]);

  useEffect(() => {
    setSelected((current) => {
      if (!current) return null;
      return files.find((file) => file.id === current.id) ?? null;
    });
  }, [files]);

  async function onPreview(file: FileAsset) {
    setSelected(file);
  }

  function openFolder(folder: DriveFolder) {
    setFolderTrail((current) => [...current, folder]);
    setActiveFolderId(folder.id);
  }

  function goBackFolder() {
    setFolderTrail((current) => {
      const next = current.slice(0, -1);
      setActiveFolderId(next.at(-1)?.id ?? null);
      return next;
    });
  }

  async function onCopyLink(file: FileAsset) {
    try {
      await navigator.clipboard.writeText(buildDriveFileAbsoluteUrl(file));
      toast.success('File link copied');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to copy file link');
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fileId = new URLSearchParams(window.location.search).get('fileId');
    if (!fileId) return;
    const existing = rawFiles.find((file) => file.id === fileId);
    if (existing) {
      setSelected(existing);
      return;
    }
    let cancelled = false;
    driveApi
      .getFileAsset(fileId)
      .then((file) => {
        if (cancelled) return;
        setRawFiles((current) =>
          current.some((item) => item.id === file.id) ? current : [file, ...current],
        );
        setSelected(file);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Could not open Drive file');
      });
    return () => {
      cancelled = true;
    };
  }, [rawFiles]);

  async function onArchive(file: FileAsset) {
    await mutateFile(() => driveApi.archiveFileAsset(file.id), 'File archived');
  }

  async function onRestore(file: FileAsset) {
    await mutateFile(() => driveApi.restoreFileAsset(file.id), 'File restored');
  }

  async function onMoveFile(file: FileAsset) {
    if (!activeFolderId) {
      toast.error('Open a folder before moving files.');
      return;
    }
    const targetFolderId = window.prompt('Target folder id');
    if (!targetFolderId?.trim()) return;
    await mutateFile(
      () =>
        driveApi.moveFolderFile({
          sourceFolderId: activeFolderId,
          targetFolderId: targetFolderId.trim(),
          fileId: file.id,
        }),
      'File moved',
    );
  }

  async function onCopyFile(file: FileAsset) {
    const targetFolderId = window.prompt('Target folder id', activeFolderId ?? '');
    if (!targetFolderId?.trim()) return;
    await mutateFile(
      () => driveApi.copyFolderFile({ targetFolderId: targetFolderId.trim(), fileId: file.id }),
      'File copied',
    );
  }

  async function onRemoveFromFolder(file: FileAsset) {
    if (!activeFolderId) {
      toast.error('Open a folder before removing files from it.');
      return;
    }
    await mutateFiles(
      async () => driveApi.removeFolderFile(activeFolderId, file.id),
      'File removed from folder',
    );
    setSelected(null);
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
      await loadFolders();
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
      await loadFolders();
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
      await loadFolders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Version upload failed');
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  }

  async function onCreateFolder() {
    if (!freeDriveSpace) return;
    const name = window.prompt('Folder name');
    if (!name?.trim()) return;
    try {
      await driveApi.createFolder({
        name,
        space: freeDriveSpace,
        parentId: activeFolderId,
      });
      toast.success('Folder created');
      await loadFolders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create folder');
    }
  }

  async function onFolderUpload(event: ChangeEvent<HTMLInputElement>) {
    if (!freeDriveSpace || !activeFolderId) {
      toast.error('Open or create a folder before uploading files.');
      event.target.value = '';
      return;
    }
    const uploadedFiles = Array.from(event.target.files ?? []);
    if (uploadedFiles.length === 0) return;
    setBusy(true);
    try {
      const folderCache = new Map<string, string>();
      for (const uploadedFile of uploadedFiles) {
        const targetFolderId = await ensureUploadTargetFolder(uploadedFile, folderCache);
        await uploadFileToFolder(uploadedFile, targetFolderId);
      }
      toast.success(uploadedFiles.length === 1 ? 'File uploaded' : 'Files uploaded');
      await loadFolders();
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  }

  async function ensureUploadTargetFolder(file: File, folderCache: Map<string, string>) {
    const relativePath = 'webkitRelativePath' in file ? String(file.webkitRelativePath) : '';
    const parts = relativePath.split('/').filter(Boolean).slice(0, -1);
    let parentId = activeFolderId;
    for (const part of parts) {
      const key = `${parentId ?? 'root'}/${part}`;
      const cached = folderCache.get(key);
      if (cached) {
        parentId = cached;
        continue;
      }
      const folder = await driveApi.createFolder({
        name: part,
        space: freeDriveSpace ?? 'COMPANY',
        parentId,
      });
      folderCache.set(key, folder.id);
      parentId = folder.id;
    }
    return parentId ?? activeFolderId;
  }

  async function uploadFileToFolder(file: File, folderId: string | null) {
    if (!folderId || !freeDriveSpace) return;
    const contentType = file.type || FALLBACK_MIME_TYPE;
    const session = await driveApi.createUploadSession({
      fileName: file.name,
      contentType,
      folderId,
      sourceModule: 'DRIVE',
      visibility: freeDriveSpace === 'PERSONAL' ? 'PERSONAL' : 'INTERNAL',
      confidentiality: 'CONFIDENTIAL',
    });
    await fetch(session.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': contentType },
    });
    await driveApi.completeUploadSession(session.sessionId, { sizeBytes: file.size });
  }

  return (
    <div className="space-y-4">
      <DriveHero
        stats={stats}
        selectedSpace={selectedSpace}
        onSelectSpace={(space) => {
          const library = DRIVE_LIBRARIES.find((item) => item.key === space.defaultLibraryKey);
          setSelectedSpace(space);
          setSelectedLibrary(library ?? DEFAULT_DRIVE_LIBRARY);
          setSelectedIds([]);
        }}
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
          space={selectedSpace}
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
            freeDriveSpace={freeDriveSpace}
            busy={busy}
            onCreateFolder={() => void onCreateFolder()}
            onFolderUpload={(event) => void onFolderUpload(event)}
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
            folders={folderListing?.folders ?? []}
            loading={loading}
            viewMode={viewMode}
            selectedId={selected?.id ?? null}
            checkedIds={selectedIds}
            onSelect={setSelected}
            onToggleChecked={toggleChecked}
            onOpenFolder={openFolder}
            onBack={folderTrail.length > 0 ? goBackFolder : undefined}
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
          onCopyLink={(file) => void onCopyLink(file)}
          onCopyFile={(file) => void onCopyFile(file)}
          onMoveFile={(file) => void onMoveFile(file)}
          onRemoveFromFolder={(file) => void onRemoveFromFolder(file)}
          onVersionUpload={(file, event) => void onVersionUpload(file, event)}
        />
      </div>
    </div>
  );
}
