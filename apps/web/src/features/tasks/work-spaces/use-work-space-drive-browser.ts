'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { resolveDriveEntityFolderScope } from '@/features/drive/drive-entity-folder-scope';
import { getDriveClientUploadDisplayName } from '@/features/drive/drive-client-upload-display-name';
import { buildDriveLibraryUploadSessionFields } from '@/features/drive/drive-library-upload-defaults';
import { FALLBACK_MIME_TYPE } from '@/features/drive/drive-options';
import { mergeFileAssetsById } from '@/features/drive/drive-utils';
import {
  driveApi,
  type DriveFolder,
  type DriveFolderListing,
  type FileAsset,
} from '@/lib/api/drive';
import {
  WORK_SPACE_DRIVE_ENTITY_TYPE,
  WORKSPACE_DRIVE_DEFAULT_PURPOSE,
  WORKSPACE_DRIVE_LIBRARY,
} from './work-space-drive-constants';

export function useWorkSpaceDriveBrowser(workSpaceId: string, enabled: boolean) {
  const folderScope = useMemo(
    () => resolveDriveEntityFolderScope(WORK_SPACE_DRIVE_ENTITY_TYPE, workSpaceId),
    [workSpaceId],
  );

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [folderTrail, setFolderTrail] = useState<DriveFolder[]>([]);
  const [listing, setListing] = useState<DriveFolderListing | null>(null);
  const [rootLinkedFiles, setRootLinkedFiles] = useState<FileAsset[]>([]);
  const [rootStorageFolderId, setRootStorageFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const listingRequestId = useRef(0);

  const atRoot = activeFolderId === null && folderTrail.length === 0;
  const placementFolderId = activeFolderId ?? rootStorageFolderId;

  const loadRootLinkedFiles = useCallback(async () => {
    if (!atRoot) {
      setRootLinkedFiles([]);
      return;
    }
    try {
      const rows = await driveApi.listFileAssets({
        status: 'ACTIVE',
        entityType: WORK_SPACE_DRIVE_ENTITY_TYPE,
        entityId: workSpaceId,
      });
      setRootLinkedFiles(rows);
    } catch {
      setRootLinkedFiles([]);
    }
  }, [atRoot, workSpaceId]);

  const loadFolders = useCallback(async () => {
    if (!folderScope || !enabled) return;
    const requestId = ++listingRequestId.current;
    setLoading(true);
    try {
      const nextListing = await driveApi.listFolder({
        scopeEntityType: folderScope.scopeEntityType,
        scopeEntityId: folderScope.scopeEntityId,
        parentId: activeFolderId,
      });
      if (requestId !== listingRequestId.current) return;
      setListing(nextListing);
      if (nextListing.rootStorageFolderId) {
        setRootStorageFolderId(nextListing.rootStorageFolderId);
      }
    } catch (err) {
      if (requestId !== listingRequestId.current) return;
      toast.error(err instanceof Error ? err.message : 'Failed to load workspace files');
      setListing(null);
    } finally {
      if (requestId === listingRequestId.current) setLoading(false);
    }
  }, [activeFolderId, enabled, folderScope]);

  const refresh = useCallback(async () => {
    await Promise.all([loadFolders(), loadRootLinkedFiles()]);
  }, [loadFolders, loadRootLinkedFiles]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled) {
      setActiveFolderId(null);
      setFolderTrail([]);
      setListing(null);
      setRootLinkedFiles([]);
    }
  }, [enabled]);

  const files = useMemo(() => {
    if (!listing) return [];
    if (atRoot && rootLinkedFiles.length > 0) {
      return mergeFileAssetsById(rootLinkedFiles, listing.files);
    }
    return listing.files;
  }, [atRoot, listing, rootLinkedFiles]);

  const openFolder = useCallback((folder: DriveFolder) => {
    setFolderTrail((trail) => [...trail, folder]);
    setActiveFolderId(folder.id);
  }, []);

  const goToRoot = useCallback(() => {
    setActiveFolderId(null);
    setFolderTrail([]);
  }, []);

  const goToTrailIndex = useCallback(
    (index: number) => {
      if (index < 0) {
        goToRoot();
        return;
      }
      setFolderTrail((trail) => {
        const nextTrail = trail.slice(0, index + 1);
        const target = nextTrail[index];
        setActiveFolderId(target?.id ?? null);
        return nextTrail;
      });
    },
    [goToRoot],
  );

  const uploadFiles = useCallback(
    async (uploadedFiles: readonly File[]) => {
      if (!folderScope || uploadedFiles.length === 0) return;
      setBusy(true);
      const meta = buildDriveLibraryUploadSessionFields(
        WORKSPACE_DRIVE_LIBRARY,
        WORKSPACE_DRIVE_DEFAULT_PURPOSE,
      );
      try {
        for (const file of uploadedFiles) {
          const contentType = file.type || FALLBACK_MIME_TYPE;
          const session = await driveApi.createUploadSession({
            fileName: file.name,
            contentType,
            displayName: getDriveClientUploadDisplayName(file),
            entityType: WORK_SPACE_DRIVE_ENTITY_TYPE,
            entityId: workSpaceId,
            folderId: placementFolderId ?? undefined,
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
        toast.success(uploadedFiles.length === 1 ? 'File uploaded' : 'Files uploaded');
        await refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setBusy(false);
      }
    },
    [folderScope, placementFolderId, refresh, workSpaceId],
  );

  const createFolder = useCallback(
    async (name: string) => {
      if (!folderScope) return;
      await driveApi.createFolder({
        name,
        scopeEntityType: folderScope.scopeEntityType,
        scopeEntityId: folderScope.scopeEntityId,
        parentId: activeFolderId,
      });
      toast.success('Folder created');
      await refresh();
    },
    [activeFolderId, folderScope, refresh],
  );

  return {
    folderScope,
    folders: listing?.folders ?? [],
    files,
    folderTrail,
    loading,
    busy,
    atRoot,
    openFolder,
    goToRoot,
    goToTrailIndex,
    uploadFiles,
    createFolder,
    refresh,
  };
}
