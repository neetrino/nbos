'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react';
import { toast } from 'sonner';
import {
  driveApi,
  type DriveFolder,
  type DriveFolderListing,
  type FileAsset,
} from '@/lib/api/drive';
import {
  DEFAULT_DRIVE_LIBRARY,
  DRIVE_LIBRARIES,
  DRIVE_SPACE_STORAGE_KEY,
  DRIVE_SPACES,
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
import { DriveLibraryEntityPicker, type LibraryUploadLink } from './DriveLibraryEntityPicker';
import { buildDriveLibraryUploadSessionFields } from './drive-library-upload-defaults';
import { DriveSidebarCreateMenu } from './DriveSidebarCreateMenu';
import { ALL_PURPOSES, type PurposeFilter } from './drive-types';
import {
  buildDriveStats,
  buildLibraryCounts,
  fileMatchesLibrary,
  getInitialDriveSpace,
  getInitialViewMode,
} from './drive-utils';
import {
  DriveCreateFolderDialog,
  DriveDeleteFolderDialog,
  DriveRenameFolderDialog,
} from './DriveFolderActionDialogs';
import { DriveFolderPickerDialog } from './DriveFolderPickerDialog';
import { DriveSpaceFolderTree } from './DriveSpaceFolderTree';

type FolderFilePickerState = { mode: 'move' | 'copy'; file: FileAsset };

export function DriveWorkspace() {
  const [rawFiles, setRawFiles] = useState<FileAsset[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<DriveSpaceOption>(getInitialDriveSpace);
  const [selectedLibrary, setSelectedLibrary] = useState<DriveLibraryOption>(() => {
    const space = getInitialDriveSpace();
    return (
      DRIVE_LIBRARIES.find((item) => item.key === space.defaultLibraryKey) ?? DEFAULT_DRIVE_LIBRARY
    );
  });
  const [selected, setSelected] = useState<FileAsset | null>(null);
  const status: DriveStatusFilter = 'ACTIVE';
  const purpose: PurposeFilter = ALL_PURPOSES;
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
  const [folderFilePicker, setFolderFilePicker] = useState<FolderFilePickerState | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameFolderTarget, setRenameFolderTarget] = useState<DriveFolder | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<DriveFolder | null>(null);
  const [rootStorageFolderId, setRootStorageFolderId] = useState<string | null>(null);
  const [folderTreeVersion, setFolderTreeVersion] = useState(0);
  const [systemLibraryLink, setSystemLibraryLink] = useState<LibraryUploadLink | null>(null);

  useLayoutEffect(() => {
    const rawSpace = window.localStorage.getItem(DRIVE_SPACE_STORAGE_KEY);
    const space = rawSpace ? DRIVE_SPACES.find((item) => item.key === rawSpace) : undefined;
    if (space) {
      setSelectedSpace(space);
      setSelectedLibrary(
        DRIVE_LIBRARIES.find((item) => item.key === space.defaultLibraryKey) ??
          DEFAULT_DRIVE_LIBRARY,
      );
    }
    const rawMode = window.localStorage.getItem(DRIVE_VIEW_MODE_STORAGE_KEY);
    if (rawMode === 'cards' || rawMode === 'list' || rawMode === 'table') {
      setViewMode(rawMode);
    }
  }, []);

  const effectiveStatus = selectedLibrary.status ?? status;

  const driveStorageSpace = useMemo((): 'COMPANY' | 'PERSONAL' | null => {
    if (selectedSpace.key === 'company') return 'COMPANY';
    if (selectedSpace.key === 'personal') return 'PERSONAL';
    return null;
  }, [selectedSpace.key]);

  const browseDriveFolders = useMemo(
    () =>
      Boolean(driveStorageSpace) &&
      (selectedLibrary.key === 'company' || selectedLibrary.key === 'personal'),
    [driveStorageSpace, selectedLibrary.key],
  );

  const browseSystemLibraryUploads = useMemo(() => {
    if (selectedSpace.key !== 'system') return false;
    return (
      selectedLibrary.key !== 'all' &&
      selectedLibrary.key !== 'archive' &&
      Boolean(selectedLibrary.entityTypes?.length)
    );
  }, [selectedLibrary.entityTypes, selectedLibrary.key, selectedSpace.key]);

  const atStorageLibraryRoot = activeFolderId === null && folderTrail.length === 0;

  const placementFolderId = useMemo(
    () => activeFolderId ?? rootStorageFolderId ?? null,
    [activeFolderId, rootStorageFolderId],
  );

  const moveExcludeFolderIds = useMemo(() => {
    if (!placementFolderId) return new Set<string>();
    return new Set([placementFolderId]);
  }, [placementFolderId]);

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
    setActiveFolderId(null);
    setFolderTrail([]);
  }, [selectedLibrary.key]);

  useEffect(() => {
    setSystemLibraryLink(null);
  }, [selectedLibrary.key, selectedSpace.key]);

  useEffect(() => {
    if (!browseDriveFolders) {
      setActiveFolderId(null);
      setFolderTrail([]);
    }
  }, [browseDriveFolders]);

  const loadFolders = useCallback(async () => {
    if (!driveStorageSpace) {
      setFolderListing(null);
      setRootStorageFolderId(null);
      setActiveFolderId(null);
      setFolderTrail([]);
      return;
    }
    if (!browseDriveFolders) {
      setFolderListing(null);
      try {
        const anchor = await driveApi.listFolder({
          space: driveStorageSpace,
          parentId: null,
        });
        setRootStorageFolderId(anchor.rootStorageFolderId ?? null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load Drive root');
        setRootStorageFolderId(null);
      }
      return;
    }
    try {
      const listing = await driveApi.listFolder({
        space: driveStorageSpace,
        parentId: activeFolderId,
      });
      setFolderListing(listing);
      if (listing.rootStorageFolderId) {
        setRootStorageFolderId(listing.rootStorageFolderId);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load Drive folder');
    }
  }, [activeFolderId, browseDriveFolders, driveStorageSpace]);

  useEffect(() => {
    void loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    window.localStorage.setItem(DRIVE_VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const files = useMemo(() => {
    if (folderListing && browseDriveFolders) {
      return folderListing.files;
    }
    return rawFiles.filter((file) => fileMatchesLibrary(file, selectedLibrary));
  }, [browseDriveFolders, folderListing, rawFiles, selectedLibrary]);
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

  function goToDriveRoot() {
    setFolderTrail([]);
    setActiveFolderId(null);
  }

  function navigateFolderPath(pathFromRoot: DriveFolder[]) {
    if (pathFromRoot.length === 0) {
      goToDriveRoot();
      return;
    }
    setFolderTrail(pathFromRoot);
    setActiveFolderId(pathFromRoot[pathFromRoot.length - 1]?.id ?? null);
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

  function onMoveFile(file: FileAsset) {
    if (!placementFolderId) {
      toast.error('Could not resolve the folder for this file.');
      return;
    }
    if (!driveStorageSpace) return;
    setFolderFilePicker({ mode: 'move', file });
  }

  function onCopyFile(file: FileAsset) {
    if (!driveStorageSpace) {
      toast.error('Open Company or Personal Drive to copy into a folder.');
      return;
    }
    setFolderFilePicker({ mode: 'copy', file });
  }

  async function onRemoveFromFolder(file: FileAsset) {
    if (!placementFolderId) {
      toast.error('Could not resolve the folder for this file.');
      return;
    }
    await mutateFiles(
      async () => driveApi.removeFolderFile(placementFolderId, file.id),
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

  async function mutateFileAllowThrow(action: () => Promise<FileAsset>, success: string) {
    setBusy(true);
    try {
      setSelected(await action());
      toast.success(success);
      await load();
      await loadFolders();
      if (driveStorageSpace) setFolderTreeVersion((v) => v + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Drive action failed');
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function handleFolderPickerConfirm(targetFolderId: string) {
    if (!folderFilePicker) {
      throw new Error('Picker state was cleared.');
    }
    const { mode, file } = folderFilePicker;
    if (mode === 'move') {
      const source = placementFolderId;
      if (!source) {
        toast.error('Could not resolve the source folder for this file.');
        throw new Error('Missing source folder for move.');
      }
      await mutateFileAllowThrow(
        () =>
          driveApi.moveFolderFile({
            sourceFolderId: source,
            targetFolderId,
            fileId: file.id,
          }),
        'File moved',
      );
    } else {
      await mutateFileAllowThrow(
        () => driveApi.copyFolderFile({ targetFolderId, fileId: file.id }),
        'File copied',
      );
    }
  }

  async function submitCreateFolder(name: string) {
    if (!driveStorageSpace) {
      toast.error('Open Company or Personal Drive first.');
      throw new Error('No Drive space selected.');
    }
    try {
      await driveApi.createFolder({
        name,
        space: driveStorageSpace,
        parentId: activeFolderId,
      });
      toast.success('Folder created');
      await loadFolders();
      setFolderTreeVersion((v) => v + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create folder');
      throw err;
    }
  }

  async function submitRenameFolder(folderId: string, name: string) {
    try {
      await driveApi.renameFolder(folderId, { name });
      toast.success('Folder renamed');
      await loadFolders();
      setFolderTreeVersion((v) => v + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not rename folder');
      throw err;
    }
  }

  async function confirmDeleteFolder(folderId: string) {
    try {
      await driveApi.deleteFolder(folderId);
      toast.success('Folder deleted');
      if (activeFolderId === folderId) {
        goBackFolder();
      }
      await loadFolders();
      setFolderTreeVersion((v) => v + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete folder');
      throw err;
    }
  }

  function openCreateFolderDialog() {
    if (!driveStorageSpace) return;
    setCreateFolderOpen(true);
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

  async function onFolderUpload(event: ChangeEvent<HTMLInputElement>) {
    const uploadedFiles = Array.from(event.target.files ?? []);
    if (uploadedFiles.length === 0) return;

    if (browseSystemLibraryUploads) {
      if (!systemLibraryLink) {
        toast.error('Choose a record to link files to first.');
        event.target.value = '';
        return;
      }
      if (uploadedFiles.some((f) => fileUsesNestedFolderUpload(f))) {
        toast.error('Folder uploads belong in Company or Personal Drive.');
        event.target.value = '';
        return;
      }
      setBusy(true);
      try {
        for (const uploadedFile of uploadedFiles) {
          await uploadFileToLinkedEntity(uploadedFile, systemLibraryLink);
        }
        toast.success(uploadedFiles.length === 1 ? 'File uploaded' : 'Files uploaded');
        await load();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setBusy(false);
        event.target.value = '';
      }
      return;
    }

    if (!driveStorageSpace || !placementFolderId) {
      toast.error('Drive is still loading. Try again in a moment.');
      event.target.value = '';
      return;
    }
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
      setFolderTreeVersion((v) => v + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  }

  function fileUsesNestedFolderUpload(file: File): boolean {
    const relativePath = 'webkitRelativePath' in file ? String(file.webkitRelativePath) : '';
    const segments = relativePath.split('/').filter(Boolean);
    return segments.length > 1;
  }

  async function ensureUploadTargetFolder(file: File, folderCache: Map<string, string>) {
    const relativePath = 'webkitRelativePath' in file ? String(file.webkitRelativePath) : '';
    const parts = relativePath.split('/').filter(Boolean).slice(0, -1);
    let parentId = placementFolderId;
    for (const part of parts) {
      const key = `${parentId ?? 'root'}/${part}`;
      const cached = folderCache.get(key);
      if (cached) {
        parentId = cached;
        continue;
      }
      const folder = await driveApi.createFolder({
        name: part,
        space: driveStorageSpace ?? 'COMPANY',
        parentId,
      });
      folderCache.set(key, folder.id);
      parentId = folder.id;
    }
    return parentId ?? placementFolderId;
  }

  async function uploadFileToLinkedEntity(file: File, link: LibraryUploadLink) {
    const contentType = file.type || FALLBACK_MIME_TYPE;
    const meta = buildDriveLibraryUploadSessionFields(selectedLibrary);
    const session = await driveApi.createUploadSession({
      fileName: file.name,
      contentType,
      entityType: link.entityType,
      entityId: link.entityId,
      sourceModule: meta.sourceModule,
      purpose: meta.purpose,
      visibility: meta.visibility,
      confidentiality: 'CONFIDENTIAL',
    });
    await fetch(session.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': contentType },
    });
    await driveApi.completeUploadSession(session.sessionId, { sizeBytes: file.size });
  }

  async function uploadFileToFolder(file: File, folderId: string | null) {
    if (!folderId || !driveStorageSpace) return;
    const contentType = file.type || FALLBACK_MIME_TYPE;
    const session = await driveApi.createUploadSession({
      fileName: file.name,
      contentType,
      folderId,
      sourceModule: 'DRIVE',
      visibility: driveStorageSpace === 'PERSONAL' ? 'PERSONAL' : 'INTERNAL',
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
        viewMode={viewMode}
        search={search}
        onSearchChange={setSearch}
        onSelectSpace={(space) => {
          const library = DRIVE_LIBRARIES.find((item) => item.key === space.defaultLibraryKey);
          setSelectedSpace(space);
          setSelectedLibrary(library ?? DEFAULT_DRIVE_LIBRARY);
          setSelectedIds([]);
          window.localStorage.setItem(DRIVE_SPACE_STORAGE_KEY, space.key);
        }}
        insightsOpen={insightsOpen}
        onToggleInsights={() => setInsightsOpen((current) => !current)}
        onViewModeChange={setViewMode}
        onRefresh={() => void load()}
        loading={loading}
      />

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-2xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          <DriveLibraries
            space={selectedSpace}
            selected={selectedLibrary}
            counts={libraryCounts}
            atStorageLibraryRoot={atStorageLibraryRoot}
            onSelect={(library) => {
              setSelectedLibrary(library);
              setSelectedIds([]);
              if (library.key === 'company' || library.key === 'personal') {
                goToDriveRoot();
              }
            }}
            sidebarCreateMenu={
              browseDriveFolders && driveStorageSpace ? (
                <DriveSidebarCreateMenu
                  busy={busy}
                  onNewFolder={openCreateFolderDialog}
                  onFilesSelected={(event) => void onFolderUpload(event)}
                  onFolderUpload={(event) => void onFolderUpload(event)}
                />
              ) : undefined
            }
            contextSlot={
              browseSystemLibraryUploads ? (
                <>
                  <DriveLibraryEntityPicker
                    key={selectedLibrary.key}
                    libraryKey={selectedLibrary.key}
                    value={systemLibraryLink}
                    onChange={setSystemLibraryLink}
                  />
                  <DriveSidebarCreateMenu
                    busy={busy}
                    menuMode="library-entity"
                    entityContextReady={systemLibraryLink !== null}
                    onNewFolder={openCreateFolderDialog}
                    onFilesSelected={(event) => void onFolderUpload(event)}
                    onFolderUpload={(event) => void onFolderUpload(event)}
                  />
                </>
              ) : undefined
            }
            folderTreeSlot={
              browseDriveFolders && driveStorageSpace
                ? {
                    forLibraryKey: driveStorageSpace === 'COMPANY' ? 'company' : 'personal',
                    children: (
                      <DriveSpaceFolderTree
                        key={folderTreeVersion}
                        space={driveStorageSpace}
                        activeFolderId={activeFolderId}
                        onSelectFolderPath={navigateFolderPath}
                      />
                    ),
                  }
                : undefined
            }
          />
        </div>

        <main className="min-w-0 space-y-4">
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
            onRenameFolder={
              driveStorageSpace ? (folder) => setRenameFolderTarget(folder) : undefined
            }
            onDeleteFolder={
              driveStorageSpace ? (folder) => setDeleteFolderTarget(folder) : undefined
            }
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
          onCopyFile={(file) => void onCopyFile(file)}
          onMoveFile={(file) => void onMoveFile(file)}
          onRemoveFromFolder={(file) => void onRemoveFromFolder(file)}
          onVersionUpload={(file, event) => void onVersionUpload(file, event)}
        />
      </div>

      {driveStorageSpace && (
        <DriveFolderPickerDialog
          open={Boolean(folderFilePicker)}
          onOpenChange={(next) => {
            if (!next) setFolderFilePicker(null);
          }}
          space={driveStorageSpace}
          title={folderFilePicker?.mode === 'move' ? 'Move file' : 'Copy file'}
          description={
            folderFilePicker?.mode === 'move'
              ? 'Choose the folder where this file should live next.'
              : 'Choose the folder for the new copy of this file.'
          }
          confirmLabel={folderFilePicker?.mode === 'move' ? 'Move here' : 'Copy here'}
          excludeFolderIds={folderFilePicker?.mode === 'move' ? moveExcludeFolderIds : undefined}
          initialSelectedFolderId={folderFilePicker?.mode === 'copy' ? placementFolderId : null}
          onConfirm={(targetFolderId) => handleFolderPickerConfirm(targetFolderId)}
        />
      )}

      <DriveCreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onSubmit={(name) => submitCreateFolder(name)}
      />

      <DriveRenameFolderDialog
        folder={renameFolderTarget}
        open={renameFolderTarget !== null}
        onOpenChange={(next) => {
          if (!next) setRenameFolderTarget(null);
        }}
        onSubmit={(folderId, name) => submitRenameFolder(folderId, name)}
      />

      <DriveDeleteFolderDialog
        folder={deleteFolderTarget}
        open={deleteFolderTarget !== null}
        onOpenChange={(next) => {
          if (!next) setDeleteFolderTarget(null);
        }}
        onConfirm={(folderId) => confirmDeleteFolder(folderId)}
      />
    </div>
  );
}
