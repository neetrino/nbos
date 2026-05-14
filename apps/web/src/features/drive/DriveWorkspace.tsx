'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  driveApi,
  type DriveFolder,
  type DriveFolderListing,
  type FileAsset,
} from '@/lib/api/drive';
import { projectsApi } from '@/lib/api/projects';
import { productsApi } from '@/lib/api/products';
import { tasksApi } from '@/lib/api/tasks';
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
import { DriveLibraryVirtualFolderGrid } from './DriveLibraryVirtualFolderGrid';
import { getDriveClientUploadDisplayName } from './drive-client-upload-display-name';
import { buildDriveLibraryUploadSessionFields } from './drive-library-upload-defaults';
import type { DriveLibraryEntityRow } from './drive-library-entity-loaders';
import {
  loadDriveLibraryEntityRows,
  mergeDriveLibraryEntityRows,
} from './drive-library-entity-loaders';
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
import {
  DRIVE_DEEP_LINK_FINANCE_PROJECT_ID_QUERY,
  DRIVE_DEEP_LINK_OPEN_FILE_ID_QUERY,
  DRIVE_DEEP_LINK_PRODUCT_ID_QUERY,
  DRIVE_DEEP_LINK_PROJECT_ID_QUERY,
  DRIVE_DEEP_LINK_TASK_ID_QUERY,
} from './drive-deep-link';
import { DRIVE_FILE_SORT_STORAGE_KEY, type DriveFileSortKey } from './drive-file-sort';
import { toFileSizeNumber } from './drive-format';

type FolderFilePickerState = { mode: 'move' | 'copy'; file: FileAsset };

type LibraryUploadLink = { entityType: string; entityId: string };

export function DriveWorkspace() {
  const searchParams = useSearchParams();
  const driveDeepLinkProjectId = searchParams.get(DRIVE_DEEP_LINK_PROJECT_ID_QUERY)?.trim() ?? '';
  const driveDeepLinkProductId = searchParams.get(DRIVE_DEEP_LINK_PRODUCT_ID_QUERY)?.trim() ?? '';
  const driveDeepLinkTaskId = searchParams.get(DRIVE_DEEP_LINK_TASK_ID_QUERY)?.trim() ?? '';
  const driveDeepLinkFinanceProjectId =
    searchParams.get(DRIVE_DEEP_LINK_FINANCE_PROJECT_ID_QUERY)?.trim() ?? '';
  const driveOpenFileId = searchParams.get(DRIVE_DEEP_LINK_OPEN_FILE_ID_QUERY)?.trim() ?? '';
  const [selectedSpace, setSelectedSpace] = useState<DriveSpaceOption>(getInitialDriveSpace);
  const [selectedLibrary, setSelectedLibrary] = useState<DriveLibraryOption>(() => {
    const space = getInitialDriveSpace();
    return (
      DRIVE_LIBRARIES.find((item) => item.key === space.defaultLibraryKey) ?? DEFAULT_DRIVE_LIBRARY
    );
  });
  const [rawFiles, setRawFiles] = useState<FileAsset[]>([]);
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
  const [maintenanceSummary, setMaintenanceSummary] = useState<{
    failedUploadSessions: number;
    expiredPendingUploadSessions: number;
  } | null>(null);
  const [purgeBusy, setPurgeBusy] = useState(false);
  const [linkAggregates, setLinkAggregates] = useState<
    { entityType: string; entityId: string; count: number }[]
  >([]);
  const [fileSort, setFileSort] = useState<DriveFileSortKey>(() => {
    if (typeof window === 'undefined') return 'updated';
    const r = window.localStorage.getItem(DRIVE_FILE_SORT_STORAGE_KEY);
    return r === 'name' || r === 'size' || r === 'updated' ? r : 'updated';
  });
  const [libraryPlacePickerOpen, setLibraryPlacePickerOpen] = useState(false);
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
  const [drivePinnedProjectRow, setDrivePinnedProjectRow] = useState<DriveLibraryEntityRow | null>(
    null,
  );
  const [drivePinnedProductRow, setDrivePinnedProductRow] = useState<DriveLibraryEntityRow | null>(
    null,
  );
  const [drivePinnedTaskRow, setDrivePinnedTaskRow] = useState<DriveLibraryEntityRow | null>(null);
  const [drivePinnedFinanceProjectRow, setDrivePinnedFinanceProjectRow] =
    useState<DriveLibraryEntityRow | null>(null);
  const [libraryEntityFolderRows, setLibraryEntityFolderRows] = useState<DriveLibraryEntityRow[]>(
    [],
  );
  const [libraryEntityFoldersLoading, setLibraryEntityFoldersLoading] = useState(false);

  useLayoutEffect(() => {
    if (driveOpenFileId) {
      const sharedSpace = DRIVE_SPACES.find((item) => item.key === 'shared');
      const sharedLibrary = DRIVE_LIBRARIES.find((item) => item.key === 'shared');
      if (sharedSpace) {
        setSelectedSpace(sharedSpace);
        window.localStorage.setItem(DRIVE_SPACE_STORAGE_KEY, sharedSpace.key);
      }
      if (sharedLibrary) setSelectedLibrary(sharedLibrary);
      setSystemLibraryLink(null);
      setDrivePinnedProjectRow(null);
      setDrivePinnedProductRow(null);
      setDrivePinnedTaskRow(null);
      setDrivePinnedFinanceProjectRow(null);
      return;
    }

    if (driveDeepLinkProductId) {
      const systemSpace = DRIVE_SPACES.find((item) => item.key === 'system');
      const productsLibrary = DRIVE_LIBRARIES.find((item) => item.key === 'products');
      if (systemSpace) {
        setSelectedSpace(systemSpace);
        window.localStorage.setItem(DRIVE_SPACE_STORAGE_KEY, systemSpace.key);
      }
      if (productsLibrary) setSelectedLibrary(productsLibrary);
      setSystemLibraryLink({
        entityType: 'PRODUCT',
        entityId: driveDeepLinkProductId,
      });
      setDrivePinnedProjectRow(null);
      setDrivePinnedTaskRow(null);
      setDrivePinnedFinanceProjectRow(null);
      return;
    }

    if (driveDeepLinkTaskId) {
      const systemSpace = DRIVE_SPACES.find((item) => item.key === 'system');
      const tasksLibrary = DRIVE_LIBRARIES.find((item) => item.key === 'tasks');
      if (systemSpace) {
        setSelectedSpace(systemSpace);
        window.localStorage.setItem(DRIVE_SPACE_STORAGE_KEY, systemSpace.key);
      }
      if (tasksLibrary) setSelectedLibrary(tasksLibrary);
      setSystemLibraryLink({
        entityType: 'TASK',
        entityId: driveDeepLinkTaskId,
      });
      setDrivePinnedProjectRow(null);
      setDrivePinnedProductRow(null);
      setDrivePinnedFinanceProjectRow(null);
      return;
    }

    if (driveDeepLinkFinanceProjectId) {
      const systemSpace = DRIVE_SPACES.find((item) => item.key === 'system');
      const financeLibrary = DRIVE_LIBRARIES.find((item) => item.key === 'finance');
      if (systemSpace) {
        setSelectedSpace(systemSpace);
        window.localStorage.setItem(DRIVE_SPACE_STORAGE_KEY, systemSpace.key);
      }
      if (financeLibrary) setSelectedLibrary(financeLibrary);
      setSystemLibraryLink({
        entityType: 'PROJECT',
        entityId: driveDeepLinkFinanceProjectId,
      });
      setDrivePinnedProductRow(null);
      setDrivePinnedTaskRow(null);
      setDrivePinnedProjectRow(null);
      return;
    }

    if (driveDeepLinkProjectId) {
      const systemSpace = DRIVE_SPACES.find((item) => item.key === 'system');
      const projectsLibrary = DRIVE_LIBRARIES.find((item) => item.key === 'projects');
      if (systemSpace) {
        setSelectedSpace(systemSpace);
        window.localStorage.setItem(DRIVE_SPACE_STORAGE_KEY, systemSpace.key);
      }
      if (projectsLibrary) setSelectedLibrary(projectsLibrary);
      setSystemLibraryLink({
        entityType: 'PROJECT',
        entityId: driveDeepLinkProjectId,
      });
      setDrivePinnedProductRow(null);
      setDrivePinnedTaskRow(null);
      setDrivePinnedFinanceProjectRow(null);
      return;
    }

    setSystemLibraryLink(null);
    setDrivePinnedProjectRow(null);
    setDrivePinnedProductRow(null);
    setDrivePinnedTaskRow(null);
    setDrivePinnedFinanceProjectRow(null);

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
  }, [
    driveOpenFileId,
    driveDeepLinkProjectId,
    driveDeepLinkProductId,
    driveDeepLinkTaskId,
    driveDeepLinkFinanceProjectId,
  ]);

  useEffect(() => {
    const pid = driveDeepLinkProjectId;
    if (!pid || selectedSpace.key !== 'system' || selectedLibrary.key !== 'projects') {
      setDrivePinnedProjectRow(null);
      return;
    }
    let cancelled = false;
    void projectsApi
      .getById(pid)
      .then((p) => {
        if (!cancelled) {
          setDrivePinnedProjectRow({
            id: p.id,
            entityType: 'PROJECT',
            label: `${p.code} — ${p.name}`,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDrivePinnedProjectRow({
            id: pid,
            entityType: 'PROJECT',
            label: `Project ${pid.slice(0, 8)}…`,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [driveDeepLinkProjectId, selectedLibrary.key, selectedSpace.key]);

  useEffect(() => {
    const pid = driveDeepLinkProductId;
    if (!pid || selectedSpace.key !== 'system' || selectedLibrary.key !== 'products') {
      setDrivePinnedProductRow(null);
      return;
    }
    let cancelled = false;
    void productsApi
      .getById(pid)
      .then((p) => {
        if (!cancelled) {
          setDrivePinnedProductRow({
            id: p.id,
            entityType: 'PRODUCT',
            label: p.project ? `${p.name} (${p.project.code})` : p.name,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDrivePinnedProductRow({
            id: pid,
            entityType: 'PRODUCT',
            label: `Product ${pid.slice(0, 8)}…`,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [driveDeepLinkProductId, selectedLibrary.key, selectedSpace.key]);

  useEffect(() => {
    const tid = driveDeepLinkTaskId;
    if (!tid || selectedSpace.key !== 'system' || selectedLibrary.key !== 'tasks') {
      setDrivePinnedTaskRow(null);
      return;
    }
    let cancelled = false;
    void tasksApi
      .getById(tid)
      .then((t) => {
        if (!cancelled) {
          setDrivePinnedTaskRow({
            id: t.id,
            entityType: 'TASK',
            label: `${t.code} — ${t.title}`,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDrivePinnedTaskRow({
            id: tid,
            entityType: 'TASK',
            label: `Task ${tid.slice(0, 8)}…`,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [driveDeepLinkTaskId, selectedLibrary.key, selectedSpace.key]);

  useEffect(() => {
    const pid = driveDeepLinkFinanceProjectId;
    if (!pid || selectedSpace.key !== 'system' || selectedLibrary.key !== 'finance') {
      setDrivePinnedFinanceProjectRow(null);
      return;
    }
    let cancelled = false;
    void projectsApi
      .getById(pid)
      .then((p) => {
        if (!cancelled) {
          setDrivePinnedFinanceProjectRow({
            id: p.id,
            entityType: 'PROJECT',
            label: `${p.code} — ${p.name}`,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDrivePinnedFinanceProjectRow({
            id: pid,
            entityType: 'PROJECT',
            label: `Project ${pid.slice(0, 8)}…`,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [driveDeepLinkFinanceProjectId, selectedLibrary.key, selectedSpace.key]);

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

  const libraryPinnedEntityRows = useMemo((): DriveLibraryEntityRow[] | undefined => {
    if (selectedLibrary.key === 'projects' && drivePinnedProjectRow) return [drivePinnedProjectRow];
    if (selectedLibrary.key === 'products' && drivePinnedProductRow) return [drivePinnedProductRow];
    if (selectedLibrary.key === 'tasks' && drivePinnedTaskRow) return [drivePinnedTaskRow];
    if (selectedLibrary.key === 'finance' && drivePinnedFinanceProjectRow) {
      return [drivePinnedFinanceProjectRow];
    }
    return undefined;
  }, [
    drivePinnedFinanceProjectRow,
    drivePinnedProductRow,
    drivePinnedProjectRow,
    drivePinnedTaskRow,
    selectedLibrary.key,
  ]);

  const mergedLibraryEntityRows = useMemo(
    () => mergeDriveLibraryEntityRows(libraryEntityFolderRows, libraryPinnedEntityRows),
    [libraryEntityFolderRows, libraryPinnedEntityRows],
  );

  const browseSystemLibraryEntityRoot = browseSystemLibraryUploads && !systemLibraryLink;

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
      const scopedToLibraryEntity =
        browseSystemLibraryUploads && systemLibraryLink
          ? {
              entityType: systemLibraryLink.entityType,
              entityId: systemLibraryLink.entityId,
            }
          : {};
      const sharedDriveSpace = selectedSpace.key === 'shared';
      const list = await driveApi.listFileAssets({
        status: sharedDriveSpace ? undefined : effectiveStatus,
        purpose: purpose === ALL_PURPOSES ? undefined : purpose,
        search: search || undefined,
        ...(sharedDriveSpace ? { sharedWithMe: true } : {}),
        ...scopedToLibraryEntity,
      });
      setRawFiles(list);
      setSelectedIds((current) => current.filter((id) => list.some((file) => file.id === id)));
      setSelected((current) => {
        const preferredId = driveOpenFileId || current?.id;
        if (!preferredId) return null;
        return list.find((file) => file.id === preferredId) ?? null;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load Drive files';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [
    browseSystemLibraryUploads,
    driveOpenFileId,
    effectiveStatus,
    purpose,
    search,
    selectedSpace.key,
    systemLibraryLink,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setActiveFolderId(null);
    setFolderTrail([]);
  }, [selectedLibrary.key]);

  useEffect(() => {
    if (!browseDriveFolders) {
      setActiveFolderId(null);
      setFolderTrail([]);
    }
  }, [browseDriveFolders]);

  useEffect(() => {
    if (!browseSystemLibraryUploads) {
      setLibraryEntityFolderRows([]);
      setLibraryEntityFoldersLoading(false);
      return;
    }
    let cancelled = false;
    setLibraryEntityFoldersLoading(true);
    void loadDriveLibraryEntityRows(selectedLibrary.key)
      .then((rows) => {
        if (!cancelled) setLibraryEntityFolderRows(rows);
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Could not load library records');
        if (!cancelled) setLibraryEntityFolderRows([]);
      })
      .finally(() => {
        if (!cancelled) setLibraryEntityFoldersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [browseSystemLibraryUploads, selectedLibrary.key]);

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

  useEffect(() => {
    window.localStorage.setItem(DRIVE_FILE_SORT_STORAGE_KEY, fileSort);
  }, [fileSort]);

  useEffect(() => {
    if (!insightsOpen) return;
    let cancelled = false;
    void driveApi.getDriveCleanupSummary().then((s) => {
      if (!cancelled) setMaintenanceSummary(s);
    });
    return () => {
      cancelled = true;
    };
  }, [insightsOpen]);

  useEffect(() => {
    if (!insightsOpen || !systemLibraryLink) {
      setLinkAggregates([]);
      return;
    }
    let cancelled = false;
    void driveApi
      .getLibraryLinkAggregates({
        entityType: systemLibraryLink.entityType,
        entityId: systemLibraryLink.entityId,
      })
      .then((rows) => {
        if (!cancelled) setLinkAggregates(rows);
      })
      .catch(() => {
        if (!cancelled) setLinkAggregates([]);
      });
    return () => {
      cancelled = true;
    };
  }, [insightsOpen, systemLibraryLink]);

  const activeLibraryEntityLabel = useMemo(() => {
    if (!systemLibraryLink) return null;
    const row = mergedLibraryEntityRows.find(
      (r) => r.entityType === systemLibraryLink.entityType && r.id === systemLibraryLink.entityId,
    );
    if (row) return row.label;
    const shortId =
      systemLibraryLink.entityId.length > 10
        ? `${systemLibraryLink.entityId.slice(0, 8)}…`
        : systemLibraryLink.entityId;
    return `${systemLibraryLink.entityType} ${shortId}`;
  }, [mergedLibraryEntityRows, systemLibraryLink]);

  const files = useMemo(() => {
    if (browseSystemLibraryEntityRoot) {
      return [];
    }
    if (folderListing && browseDriveFolders) {
      return folderListing.files;
    }
    return rawFiles.filter((file) =>
      fileMatchesLibrary(file, selectedLibrary, { spaceKey: selectedSpace.key }),
    );
  }, [
    browseDriveFolders,
    browseSystemLibraryEntityRoot,
    folderListing,
    rawFiles,
    selectedLibrary,
    selectedSpace.key,
  ]);
  const sortedFiles = useMemo(() => {
    const list = [...files];
    const byUpdated = (a: FileAsset, b: FileAsset) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    if (fileSort === 'name') {
      list.sort((a, b) => a.displayName.localeCompare(b.displayName));
    } else if (fileSort === 'size') {
      list.sort((a, b) => toFileSizeNumber(b.sizeBytes) - toFileSizeNumber(a.sizeBytes));
    } else {
      list.sort(byUpdated);
    }
    return list;
  }, [files, fileSort]);
  const stats = useMemo(() => buildDriveStats(files), [files]);
  const libraryCounts = useMemo(
    () => buildLibraryCounts(rawFiles, selectedSpace.key),
    [rawFiles, selectedSpace.key],
  );

  const handlePurgeFailed = useCallback(async () => {
    setPurgeBusy(true);
    try {
      const r = await driveApi.purgeDriveCleanup('failed');
      toast.success(r.deleted === 0 ? 'Nothing to purge' : `Removed ${r.deleted} failed sessions`);
      const s = await driveApi.getDriveCleanupSummary();
      setMaintenanceSummary(s);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Purge failed');
    } finally {
      setPurgeBusy(false);
    }
  }, []);

  const handlePurgeExpired = useCallback(async () => {
    setPurgeBusy(true);
    try {
      const r = await driveApi.purgeDriveCleanup('expired-pending');
      toast.success(
        r.deleted === 0 ? 'Nothing to purge' : `Removed ${r.deleted} expired pending sessions`,
      );
      const s = await driveApi.getDriveCleanupSummary();
      setMaintenanceSummary(s);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Purge failed');
    } finally {
      setPurgeBusy(false);
    }
  }, []);

  const maintenanceCleanupProp = useMemo(() => {
    if (!insightsOpen || !maintenanceSummary) return null;
    return {
      failedUploadSessions: maintenanceSummary.failedUploadSessions,
      expiredPendingUploadSessions: maintenanceSummary.expiredPendingUploadSessions,
      purgeBusy,
      onPurgeFailed: () => void handlePurgeFailed(),
      onPurgeExpired: () => void handlePurgeExpired(),
    };
  }, [handlePurgeExpired, handlePurgeFailed, insightsOpen, maintenanceSummary, purgeBusy]);

  const handleDragMoveFilesToFolder = useCallback(
    async (fileIds: string[], targetFolderId: string) => {
      const source = placementFolderId;
      if (!source || targetFolderId === source || fileIds.length === 0) return;
      setBusy(true);
      try {
        for (const fileId of fileIds) {
          await driveApi.moveFolderFile({
            sourceFolderId: source,
            targetFolderId,
            fileId,
          });
        }
        toast.success(fileIds.length === 1 ? 'File moved' : `${fileIds.length} files moved`);
        await loadFolders();
        await load();
        setFolderTreeVersion((v) => v + 1);
        setSelectedIds((ids) => ids.filter((id) => !fileIds.includes(id)));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Move failed');
      } finally {
        setBusy(false);
      }
    },
    [load, loadFolders, placementFolderId],
  );

  const fileDragConfig = useMemo(() => {
    if (!browseDriveFolders || !placementFolderId) return undefined;
    return {
      sourceFolderId: placementFolderId,
      resolveDragFileIds: (file: FileAsset) =>
        selectedIds.length > 0 && selectedIds.includes(file.id) ? [...selectedIds] : [file.id],
    };
  }, [browseDriveFolders, placementFolderId, selectedIds]);

  const folderFileDropConfig = useMemo(
    () =>
      browseDriveFolders && placementFolderId
        ? {
            sourceFolderId: placementFolderId,
            onMoveFilesToFolder: handleDragMoveFilesToFolder,
            busy,
          }
        : undefined,
    [browseDriveFolders, busy, handleDragMoveFilesToFolder, placementFolderId],
  );

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

  async function handleLibraryPlaceConfirm(targetFolderId: string) {
    if (selectedIds.length === 0) return;
    setBusy(true);
    try {
      for (const id of selectedIds) {
        await driveApi.addFileToFolder(targetFolderId, id);
      }
      toast.success(
        selectedIds.length === 1
          ? 'File added to folder'
          : `${selectedIds.length} files placed in folder`,
      );
      setLibraryPlacePickerOpen(false);
      setSelectedIds([]);
      await load();
      if (driveStorageSpace) void loadFolders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not place files in folder');
    } finally {
      setBusy(false);
    }
  }

  async function handleExportManifestForSelection() {
    if (selectedIds.length === 0) return;
    setBusy(true);
    try {
      const manifest = await driveApi.buildExportManifest(selectedIds);
      const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `drive-export-manifest-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Manifest downloaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setBusy(false);
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
      setBusy(true);
      try {
        for (const uploadedFile of uploadedFiles) {
          await uploadFileToLinkedEntity(uploadedFile, systemLibraryLink);
        }
        toast.success(
          uploadedFiles.length === 1
            ? 'File uploaded'
            : uploadedFiles.some(
                  (f) => 'webkitRelativePath' in f && String(f.webkitRelativePath).includes('/'),
                )
              ? `${uploadedFiles.length} files uploaded (folder paths in display names)`
              : `${uploadedFiles.length} files uploaded`,
        );
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
    const displayName = getDriveClientUploadDisplayName(file);
    const session = await driveApi.createUploadSession({
      fileName: file.name,
      contentType,
      displayName,
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
          setSystemLibraryLink(null);
          window.localStorage.setItem(DRIVE_SPACE_STORAGE_KEY, space.key);
        }}
        insightsOpen={insightsOpen}
        onToggleInsights={() => setInsightsOpen((current) => !current)}
        onViewModeChange={setViewMode}
        onRefresh={() => void load()}
        loading={loading}
        maintenanceCleanup={maintenanceCleanupProp}
        libraryLinkAggregates={insightsOpen ? linkAggregates : []}
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
              setSystemLibraryLink(null);
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
                <DriveSidebarCreateMenu
                  busy={busy}
                  menuMode="library-entity"
                  entityContextReady={systemLibraryLink !== null}
                  onNewFolder={openCreateFolderDialog}
                  onFilesSelected={(event) => void onFolderUpload(event)}
                  onFolderUpload={(event) => void onFolderUpload(event)}
                />
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
                        folderFileDrop={folderFileDropConfig}
                        onSelectFolderPath={navigateFolderPath}
                      />
                    ),
                  }
                : undefined
            }
          />
        </div>

        <main className="min-w-0 space-y-4">
          {selectedIds.length > 0 && !browseSystemLibraryEntityRoot && (
            <BulkActionBar
              count={selectedIds.length}
              archived={effectiveStatus === 'ARCHIVED'}
              busy={busy}
              onArchive={() => void onBulkArchive()}
              onRestore={() => void onBulkRestore()}
              onClear={() => setSelectedIds([])}
              showLibraryBulkActions={Boolean(
                browseSystemLibraryUploads && systemLibraryLink && selectedSpace.key === 'system',
              )}
              onPlaceInCompanyFolder={() => setLibraryPlacePickerOpen(true)}
              onExportManifest={() => void handleExportManifestForSelection()}
            />
          )}

          {!browseSystemLibraryEntityRoot ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-xs font-medium">Sort</span>
              <Select
                value={fileSort}
                onValueChange={(v) =>
                  setFileSort(
                    (v === 'name' || v === 'size' || v === 'updated'
                      ? v
                      : 'updated') as DriveFileSortKey,
                  )
                }
              >
                <SelectTrigger className="h-8 w-[10.5rem]" aria-label="Sort files">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">Recently updated</SelectItem>
                  <SelectItem value="name">Name (A–Z)</SelectItem>
                  <SelectItem value="size">Size (largest first)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {driveDeepLinkProjectId &&
          selectedSpace.key === 'system' &&
          selectedLibrary.key === 'projects' ? (
            <p className="text-muted-foreground text-xs">
              Project hub: files are scoped to this project. Open Company or Personal Drive to
              manage folder trees.
            </p>
          ) : null}

          {browseSystemLibraryUploads && systemLibraryLink ? (
            <div className="border-border/60 bg-muted/20 flex flex-wrap items-center gap-1 rounded-2xl border px-3 py-2 text-sm">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-8 shrink-0 px-2"
                onClick={() => setSystemLibraryLink(null)}
              >
                All {selectedLibrary.title}
              </Button>
              <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
              <span className="text-foreground min-w-0 flex-1 truncate font-medium">
                {activeLibraryEntityLabel ?? 'Record'}
              </span>
            </div>
          ) : null}

          {browseSystemLibraryEntityRoot ? (
            <DriveLibraryVirtualFolderGrid
              libraryTitle={selectedLibrary.title}
              rows={mergedLibraryEntityRows}
              loading={libraryEntityFoldersLoading}
              searchQuery={search}
              onOpenRow={(row) =>
                setSystemLibraryLink({ entityType: row.entityType, entityId: row.id })
              }
            />
          ) : (
            <DriveFileSurface
              files={sortedFiles}
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
              fileMenu={{
                onOpenDetails: onPreview,
                onCopyFile,
                onMoveFile,
                onArchive,
                onRestore,
                onRemoveFromFolder: browseDriveFolders ? onRemoveFromFolder : undefined,
                busy,
              }}
              fileDrag={fileDragConfig}
              folderFileDrop={folderFileDropConfig}
            />
          )}
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
          onFileDetailRefresh={() => void load()}
          onPermanentDeleteSuccess={() => {
            void load();
            setSelected(null);
          }}
        />
      </div>

      <DriveFolderPickerDialog
        open={libraryPlacePickerOpen}
        onOpenChange={setLibraryPlacePickerOpen}
        space="COMPANY"
        title="Place files in Company Drive"
        description="Choose a folder. Selected library files will be added as placements (the FileAsset is not duplicated)."
        confirmLabel="Place here"
        onConfirm={(targetFolderId) => void handleLibraryPlaceConfirm(targetFolderId)}
      />

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
