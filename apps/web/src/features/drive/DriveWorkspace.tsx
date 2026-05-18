'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
  type DriveCleanupCandidateCategory,
  type DriveFolder,
  type DriveFolderListing,
  type DriveZipExportJobSummary,
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
import { DriveLifecycleNav } from './DriveLifecycleNav';
import {
  DRIVE_LIFECYCLE_HINTS,
  DRIVE_LIFECYCLE_TITLES,
  filterFilesForLifecycleView,
  type DriveLifecycleView,
} from './drive-lifecycle';
import { DriveLibraryVirtualFolderGrid } from './DriveLibraryVirtualFolderGrid';
import { getDriveClientUploadDisplayName } from './drive-client-upload-display-name';
import { buildDriveLibraryUploadSessionFields } from './drive-library-upload-defaults';
import type { DriveLibraryEntityRow } from './drive-library-entity-loaders';
import {
  buildDriveLibraryEntityRow,
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
  mergeFileAssetsById,
} from './drive-utils';
import {
  DriveCreateFolderDialog,
  DriveDeleteFolderDialog,
  DriveRenameFolderDialog,
} from './DriveFolderActionDialogs';
import { DriveFolderPickerDialog } from './DriveFolderPickerDialog';
import { DriveSpaceFolderTree } from './DriveSpaceFolderTree';
import {
  DRIVE_DEEP_LINK_COMPANY_ID_QUERY,
  DRIVE_DEEP_LINK_CONTACT_ID_QUERY,
  DRIVE_DEEP_LINK_DEAL_ID_QUERY,
  DRIVE_DEEP_LINK_FINANCE_PROJECT_ID_QUERY,
  DRIVE_DEEP_LINK_OPEN_FILE_ID_QUERY,
  DRIVE_DEEP_LINK_PRODUCT_ID_QUERY,
  DRIVE_DEEP_LINK_PROJECT_ID_QUERY,
  DRIVE_DEEP_LINK_TASK_ID_QUERY,
  DRIVE_DEEP_LINK_WORKSPACE_ID_QUERY,
} from './drive-deep-link';
import { useDriveExportJobsPoll } from './use-drive-export-jobs-poll';
import {
  DRIVE_FILE_SORT_STORAGE_KEY,
  parseDriveFileSortKey,
  type DriveFileSortKey,
} from './drive-file-sort';
import { toFileSizeNumber } from './drive-format';
import { collectFileAssetIdsInFolderSubtree } from './drive-folder-selection-expand';
import { resolveDriveEntityFolderScope } from './drive-entity-folder-scope';
import { folderListingMatchesBrowseContext } from './drive-folder-listing-match';
import {
  findLibraryRecordFileLink,
  resolveDriveActionCapabilities,
} from './drive-action-capabilities';
import { DRIVE_ZIP_UI_MAX_FILES } from './drive-zip-ui-limits';
import { runDriveZipExportJob } from './drive-zip-export-run';
import { buildDriveTypedExportActions, type DriveTypedExportAction } from './drive-export-ui';
import { DriveProjectHubNav } from './DriveProjectHubNav';
import {
  DRIVE_PROJECT_HUB_DEFAULT_VIEW,
  isProjectHubFileBrowse,
  projectHubSectionNeedsFocus,
  resolveProjectHubFileListParams,
  resolveProjectHubFocusLabel,
  type DriveProjectHubView,
  type ProjectDriveHubSummary,
} from './drive-project-hub-view';

type FolderFilePickerState = { mode: 'move' | 'copy'; file: FileAsset };

type LibraryUploadLink = { entityType: string; entityId: string };

export function DriveWorkspace() {
  const searchParams = useSearchParams();
  const driveDeepLinkProjectId = searchParams.get(DRIVE_DEEP_LINK_PROJECT_ID_QUERY)?.trim() ?? '';
  const driveDeepLinkProductId = searchParams.get(DRIVE_DEEP_LINK_PRODUCT_ID_QUERY)?.trim() ?? '';
  const driveDeepLinkTaskId = searchParams.get(DRIVE_DEEP_LINK_TASK_ID_QUERY)?.trim() ?? '';
  const driveDeepLinkWorkSpaceId =
    searchParams.get(DRIVE_DEEP_LINK_WORKSPACE_ID_QUERY)?.trim() ?? '';
  const driveDeepLinkFinanceProjectId =
    searchParams.get(DRIVE_DEEP_LINK_FINANCE_PROJECT_ID_QUERY)?.trim() ?? '';
  const driveDeepLinkCompanyId = searchParams.get(DRIVE_DEEP_LINK_COMPANY_ID_QUERY)?.trim() ?? '';
  const driveDeepLinkContactId = searchParams.get(DRIVE_DEEP_LINK_CONTACT_ID_QUERY)?.trim() ?? '';
  const driveDeepLinkDealId = searchParams.get(DRIVE_DEEP_LINK_DEAL_ID_QUERY)?.trim() ?? '';
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
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [maintenanceSummary, setMaintenanceSummary] = useState<{
    failedUploadSessions: number;
    expiredPendingUploadSessions: number;
  } | null>(null);
  const [purgeBusy, setPurgeBusy] = useState(false);
  const [exportJobs, setExportJobs] = useState<DriveZipExportJobSummary[]>([]);
  const [cleanupCategories, setCleanupCategories] = useState<DriveCleanupCandidateCategory[]>([]);
  const [linkAggregates, setLinkAggregates] = useState<
    { entityType: string; entityId: string; count: number }[]
  >([]);
  /** SSR-safe default; preferences hydrate in `useLayoutEffect` below. */
  const [fileSort, setFileSort] = useState<DriveFileSortKey>('updated');
  const [libraryPlacePickerOpen, setLibraryPlacePickerOpen] = useState(false);
  const [folderListing, setFolderListing] = useState<DriveFolderListing | null>(null);
  const folderListingRequestId = useRef(0);
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
  const [drivePinnedWorkSpaceRow, setDrivePinnedWorkSpaceRow] =
    useState<DriveLibraryEntityRow | null>(null);
  const [drivePinnedFinanceProjectRow, setDrivePinnedFinanceProjectRow] =
    useState<DriveLibraryEntityRow | null>(null);
  const [libraryEntityFolderRows, setLibraryEntityFolderRows] = useState<DriveLibraryEntityRow[]>(
    [],
  );
  const [libraryEntityFoldersLoading, setLibraryEntityFoldersLoading] = useState(false);
  const [projectHubView, setProjectHubView] = useState<DriveProjectHubView>(
    DRIVE_PROJECT_HUB_DEFAULT_VIEW,
  );
  const [projectHubSummary, setProjectHubSummary] = useState<ProjectDriveHubSummary | null>(null);
  const [projectShellFiles, setProjectShellFiles] = useState<FileAsset[]>([]);
  const [entityRootLinkedFiles, setEntityRootLinkedFiles] = useState<FileAsset[]>([]);
  const [lifecycleView, setLifecycleView] = useState<DriveLifecycleView>('browse');
  const [lifecycleCounts, setLifecycleCounts] = useState({ archived: 0, trash: 0 });

  const inLifecycleView = lifecycleView !== 'browse';

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
      setDrivePinnedWorkSpaceRow(null);
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
      setDrivePinnedWorkSpaceRow(null);
      setDrivePinnedFinanceProjectRow(null);
      return;
    }

    if (driveDeepLinkWorkSpaceId) {
      const systemSpace = DRIVE_SPACES.find((item) => item.key === 'system');
      const tasksLibrary = DRIVE_LIBRARIES.find((item) => item.key === 'tasks');
      if (systemSpace) {
        setSelectedSpace(systemSpace);
        window.localStorage.setItem(DRIVE_SPACE_STORAGE_KEY, systemSpace.key);
      }
      if (tasksLibrary) setSelectedLibrary(tasksLibrary);
      setSystemLibraryLink({
        entityType: 'WORK_SPACE',
        entityId: driveDeepLinkWorkSpaceId,
      });
      setDrivePinnedProjectRow(null);
      setDrivePinnedProductRow(null);
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
      setDrivePinnedWorkSpaceRow(null);
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
      setDrivePinnedWorkSpaceRow(null);
      setDrivePinnedProjectRow(null);
      return;
    }

    if (driveDeepLinkDealId) {
      const systemSpace = DRIVE_SPACES.find((item) => item.key === 'system');
      const dealsLibrary = DRIVE_LIBRARIES.find((item) => item.key === 'deals');
      if (systemSpace) {
        setSelectedSpace(systemSpace);
        window.localStorage.setItem(DRIVE_SPACE_STORAGE_KEY, systemSpace.key);
      }
      if (dealsLibrary) setSelectedLibrary(dealsLibrary);
      setSystemLibraryLink({ entityType: 'DEAL', entityId: driveDeepLinkDealId });
      setDrivePinnedProjectRow(null);
      setDrivePinnedProductRow(null);
      setDrivePinnedTaskRow(null);
      setDrivePinnedWorkSpaceRow(null);
      setDrivePinnedFinanceProjectRow(null);
      return;
    }

    if (driveDeepLinkCompanyId) {
      const systemSpace = DRIVE_SPACES.find((item) => item.key === 'system');
      const clientsLibrary = DRIVE_LIBRARIES.find((item) => item.key === 'clients');
      if (systemSpace) {
        setSelectedSpace(systemSpace);
        window.localStorage.setItem(DRIVE_SPACE_STORAGE_KEY, systemSpace.key);
      }
      if (clientsLibrary) setSelectedLibrary(clientsLibrary);
      setSystemLibraryLink({ entityType: 'COMPANY', entityId: driveDeepLinkCompanyId });
      setDrivePinnedProjectRow(null);
      setDrivePinnedProductRow(null);
      setDrivePinnedTaskRow(null);
      setDrivePinnedWorkSpaceRow(null);
      setDrivePinnedFinanceProjectRow(null);
      return;
    }

    if (driveDeepLinkContactId) {
      const systemSpace = DRIVE_SPACES.find((item) => item.key === 'system');
      const clientsLibrary = DRIVE_LIBRARIES.find((item) => item.key === 'clients');
      if (systemSpace) {
        setSelectedSpace(systemSpace);
        window.localStorage.setItem(DRIVE_SPACE_STORAGE_KEY, systemSpace.key);
      }
      if (clientsLibrary) setSelectedLibrary(clientsLibrary);
      setSystemLibraryLink({ entityType: 'CONTACT', entityId: driveDeepLinkContactId });
      setDrivePinnedProjectRow(null);
      setDrivePinnedProductRow(null);
      setDrivePinnedTaskRow(null);
      setDrivePinnedWorkSpaceRow(null);
      setDrivePinnedFinanceProjectRow(null);
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
      setDrivePinnedWorkSpaceRow(null);
      setDrivePinnedFinanceProjectRow(null);
      return;
    }

    setSystemLibraryLink(null);
    setDrivePinnedProjectRow(null);
    setDrivePinnedProductRow(null);
    setDrivePinnedTaskRow(null);
    setDrivePinnedWorkSpaceRow(null);
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
    if (rawMode === 'cards' || rawMode === 'tiles' || rawMode === 'list' || rawMode === 'table') {
      setViewMode(rawMode);
    }
  }, [
    driveOpenFileId,
    driveDeepLinkProjectId,
    driveDeepLinkProductId,
    driveDeepLinkTaskId,
    driveDeepLinkWorkSpaceId,
    driveDeepLinkFinanceProjectId,
    driveDeepLinkCompanyId,
    driveDeepLinkContactId,
    driveDeepLinkDealId,
  ]);

  useLayoutEffect(() => {
    setFileSort(parseDriveFileSortKey(window.localStorage.getItem(DRIVE_FILE_SORT_STORAGE_KEY)));
  }, []);

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
          setDrivePinnedProjectRow(
            buildDriveLibraryEntityRow({
              id: p.id,
              entityType: 'PROJECT',
              code: p.code,
              name: p.name,
            }),
          );
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
          setDrivePinnedProductRow(
            buildDriveLibraryEntityRow({
              id: p.id,
              entityType: 'PRODUCT',
              name: p.name,
              code: p.project?.code ?? null,
            }),
          );
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
          setDrivePinnedTaskRow(
            buildDriveLibraryEntityRow({
              id: t.id,
              entityType: 'TASK',
              code: t.code,
              name: t.title,
            }),
          );
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
    const wid = driveDeepLinkWorkSpaceId;
    if (!wid || selectedSpace.key !== 'system' || selectedLibrary.key !== 'tasks') {
      setDrivePinnedWorkSpaceRow(null);
      return;
    }
    let cancelled = false;
    void tasksApi
      .getWorkSpaceById(wid)
      .then((w) => {
        if (!cancelled) {
          setDrivePinnedWorkSpaceRow(
            buildDriveLibraryEntityRow({
              id: w.id,
              entityType: 'WORK_SPACE',
              name: w.name,
            }),
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDrivePinnedWorkSpaceRow({
            id: wid,
            entityType: 'WORK_SPACE',
            label: `Work space ${wid.slice(0, 8)}…`,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [driveDeepLinkWorkSpaceId, selectedLibrary.key, selectedSpace.key]);

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
          setDrivePinnedFinanceProjectRow(
            buildDriveLibraryEntityRow({
              id: p.id,
              entityType: 'PROJECT',
              code: p.code,
              name: p.name,
            }),
          );
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

  const effectiveStatus =
    lifecycleView === 'archive'
      ? 'ARCHIVED'
      : lifecycleView === 'trash'
        ? 'DELETED'
        : (selectedLibrary.status ?? status);

  const driveStorageSpace = useMemo((): 'COMPANY' | 'PERSONAL' | null => {
    if (inLifecycleView) return null;
    if (selectedSpace.key === 'company') return 'COMPANY';
    if (selectedSpace.key === 'personal') return 'PERSONAL';
    return null;
  }, [inLifecycleView, selectedSpace.key]);

  const browseDriveFolders = useMemo(
    () =>
      !inLifecycleView &&
      Boolean(driveStorageSpace) &&
      (selectedLibrary.key === 'company' || selectedLibrary.key === 'personal'),
    [driveStorageSpace, inLifecycleView, selectedLibrary.key],
  );

  const libraryEntityFolderScope = useMemo(() => {
    if (!systemLibraryLink) return null;
    return resolveDriveEntityFolderScope(systemLibraryLink.entityType, systemLibraryLink.entityId);
  }, [systemLibraryLink]);

  const isProjectLibraryHub = libraryEntityFolderScope?.scopeEntityType === 'PROJECT';
  const projectHubFileBrowse = isProjectLibraryHub && isProjectHubFileBrowse(projectHubView);
  const projectHubAwaitingFocus =
    projectHubFileBrowse &&
    projectHubSectionNeedsFocus(projectHubView.section) &&
    !projectHubView.focusEntityId;

  const browseEntityScopedFolders = Boolean(libraryEntityFolderScope);
  const browseFoldersInView = browseDriveFolders || browseEntityScopedFolders;
  const browseFolderPlacements =
    browseFoldersInView && (!isProjectLibraryHub || projectHubView.section === 'folders');
  const atProjectFolderRoot =
    isProjectLibraryHub &&
    libraryEntityFolderScope?.scopeEntityType === 'PROJECT' &&
    activeFolderId === null &&
    folderTrail.length === 0;
  const atEntityScopedFolderRoot =
    browseEntityScopedFolders &&
    !isProjectLibraryHub &&
    activeFolderId === null &&
    folderTrail.length === 0;

  const browseSystemLibraryUploads = useMemo(() => {
    if (inLifecycleView || selectedSpace.key !== 'system') return false;
    return selectedLibrary.key !== 'all' && Boolean(selectedLibrary.entityTypes?.length);
  }, [inLifecycleView, selectedLibrary.entityTypes, selectedLibrary.key, selectedSpace.key]);

  const libraryPinnedEntityRows = useMemo((): DriveLibraryEntityRow[] | undefined => {
    const pinned: DriveLibraryEntityRow[] = [];
    if (selectedLibrary.key === 'projects' && drivePinnedProjectRow) {
      pinned.push(drivePinnedProjectRow);
    }
    if (selectedLibrary.key === 'products' && drivePinnedProductRow) {
      pinned.push(drivePinnedProductRow);
    }
    if (selectedLibrary.key === 'tasks') {
      if (drivePinnedTaskRow) pinned.push(drivePinnedTaskRow);
      if (drivePinnedWorkSpaceRow) pinned.push(drivePinnedWorkSpaceRow);
    }
    if (selectedLibrary.key === 'finance' && drivePinnedFinanceProjectRow) {
      pinned.push(drivePinnedFinanceProjectRow);
    }
    return pinned.length > 0 ? pinned : undefined;
  }, [
    drivePinnedFinanceProjectRow,
    drivePinnedProductRow,
    drivePinnedProjectRow,
    drivePinnedTaskRow,
    drivePinnedWorkSpaceRow,
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

  const driveActionCapabilities = useMemo(
    () =>
      resolveDriveActionCapabilities({
        browseFolderPlacements,
        projectHubFileBrowse,
        browseSystemLibraryUploads,
        systemLibraryLink,
        libraryEntityFolderScope,
        projectHubView,
        selectedSpaceKey: selectedSpace.key,
        placementFolderId,
        driveStorageSpace,
      }),
    [
      browseFolderPlacements,
      browseSystemLibraryUploads,
      driveStorageSpace,
      libraryEntityFolderScope,
      placementFolderId,
      projectHubFileBrowse,
      projectHubView,
      selectedSpace.key,
      systemLibraryLink,
    ],
  );

  const sidebarCreateMenuConfig = useMemo(() => {
    if (browseDriveFolders && driveStorageSpace) {
      return {
        menuMode: 'storage' as const,
        entityContextReady: placementFolderId !== null,
        entityScopedFolders: false,
      };
    }
    if (browseSystemLibraryUploads) {
      return {
        menuMode: 'library-entity' as const,
        entityContextReady: systemLibraryLink !== null,
        entityScopedFolders: browseEntityScopedFolders,
      };
    }
    return {
      menuMode: 'library-entity' as const,
      entityContextReady: false,
      entityScopedFolders: false,
    };
  }, [
    browseDriveFolders,
    browseEntityScopedFolders,
    browseSystemLibraryUploads,
    driveStorageSpace,
    placementFolderId,
    systemLibraryLink,
  ]);

  const moveExcludeFolderIds = useMemo(() => {
    if (!placementFolderId) return new Set<string>();
    return new Set([placementFolderId]);
  }, [placementFolderId]);

  const loadLifecycleCounts = useCallback(async () => {
    try {
      const counts = await driveApi.getDriveLifecycleCounts();
      setLifecycleCounts(counts);
    } catch {
      setLifecycleCounts({ archived: 0, trash: 0 });
    }
  }, []);

  useEffect(() => {
    void loadLifecycleCounts();
  }, [loadLifecycleCounts]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (projectHubAwaitingFocus) {
        setRawFiles([]);
        setSelectedIds([]);
        setSelected(null);
        return;
      }
      if (inLifecycleView) {
        const list = await driveApi.listFileAssets({
          ...(lifecycleView === 'trash' ? { trash: true } : { status: 'ARCHIVED' }),
          purpose: purpose === ALL_PURPOSES ? undefined : purpose,
          search: search || undefined,
        });
        setRawFiles(list);
        setSelectedIds((current) => current.filter((id) => list.some((file) => file.id === id)));
        setSelected((current) => {
          const preferredId = driveOpenFileId || current?.id;
          if (!preferredId) return null;
          return list.find((file) => file.id === preferredId) ?? null;
        });
        return;
      }
      const sharedDriveSpace = selectedSpace.key === 'shared';
      const listBase = {
        status: sharedDriveSpace ? undefined : effectiveStatus,
        purpose: purpose === ALL_PURPOSES ? undefined : purpose,
        search: search || undefined,
        ...(sharedDriveSpace ? { sharedWithMe: true } : {}),
      };
      if (browseFolderPlacements) {
        setRawFiles([]);
        setSelectedIds([]);
        setSelected(null);
        return;
      }
      const scopedToLibraryEntity =
        browseSystemLibraryUploads && systemLibraryLink && !projectHubFileBrowse
          ? {
              entityType: systemLibraryLink.entityType,
              entityId: systemLibraryLink.entityId,
            }
          : {};
      const projectId = libraryEntityFolderScope?.scopeEntityId ?? systemLibraryLink?.entityId;
      const projectHubParams =
        projectHubFileBrowse && projectId
          ? resolveProjectHubFileListParams(projectId, projectHubView, listBase, projectHubSummary)
          : {};
      const list = await driveApi.listFileAssets({
        ...listBase,
        ...scopedToLibraryEntity,
        ...projectHubParams,
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
    browseFolderPlacements,
    browseSystemLibraryUploads,
    driveOpenFileId,
    effectiveStatus,
    inLifecycleView,
    libraryEntityFolderScope,
    lifecycleView,
    projectHubAwaitingFocus,
    projectHubFileBrowse,
    projectHubSummary,
    projectHubView,
    purpose,
    search,
    selectedSpace.key,
    systemLibraryLink,
  ]);

  const loadProjectShellFiles = useCallback(async () => {
    if (!atProjectFolderRoot || !libraryEntityFolderScope) {
      setProjectShellFiles([]);
      return;
    }
    try {
      const list = await driveApi.listFileAssets({
        status: effectiveStatus,
        purpose: purpose === ALL_PURPOSES ? undefined : purpose,
        search: search || undefined,
        projectHubProjectFiles: true,
        projectId: libraryEntityFolderScope.scopeEntityId,
      });
      setProjectShellFiles(list);
    } catch {
      setProjectShellFiles([]);
    }
  }, [atProjectFolderRoot, effectiveStatus, libraryEntityFolderScope, purpose, search]);

  useEffect(() => {
    void loadProjectShellFiles();
  }, [loadProjectShellFiles]);

  const loadEntityRootLinkedFiles = useCallback(async () => {
    if (!atEntityScopedFolderRoot || !systemLibraryLink) {
      setEntityRootLinkedFiles([]);
      return;
    }
    try {
      const list = await driveApi.listFileAssets({
        status: effectiveStatus,
        purpose: purpose === ALL_PURPOSES ? undefined : purpose,
        search: search || undefined,
        entityType: systemLibraryLink.entityType,
        entityId: systemLibraryLink.entityId,
      });
      setEntityRootLinkedFiles(list);
    } catch {
      setEntityRootLinkedFiles([]);
    }
  }, [atEntityScopedFolderRoot, effectiveStatus, purpose, search, systemLibraryLink]);

  useEffect(() => {
    void loadEntityRootLinkedFiles();
  }, [loadEntityRootLinkedFiles]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setActiveFolderId(null);
    setFolderTrail([]);
  }, [selectedLibrary.key]);

  useEffect(() => {
    if (!browseFoldersInView) {
      setActiveFolderId(null);
      setFolderTrail([]);
    }
  }, [browseFoldersInView]);

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
    const requestId = ++folderListingRequestId.current;

    if (browseEntityScopedFolders && libraryEntityFolderScope) {
      try {
        const listing = await driveApi.listFolder({
          scopeEntityType: libraryEntityFolderScope.scopeEntityType,
          scopeEntityId: libraryEntityFolderScope.scopeEntityId,
          parentId: activeFolderId,
        });
        if (requestId !== folderListingRequestId.current) return;
        setFolderListing(listing);
        if (listing.rootStorageFolderId) {
          setRootStorageFolderId(listing.rootStorageFolderId);
        }
      } catch (err) {
        if (requestId !== folderListingRequestId.current) return;
        toast.error(err instanceof Error ? err.message : 'Failed to load record folders');
      }
      return;
    }
    if (!driveStorageSpace) {
      if (requestId !== folderListingRequestId.current) return;
      setFolderListing(null);
      setRootStorageFolderId(null);
      setActiveFolderId(null);
      setFolderTrail([]);
      return;
    }
    if (!browseDriveFolders) {
      if (requestId !== folderListingRequestId.current) return;
      setFolderListing(null);
      try {
        const anchor = await driveApi.listFolder({
          space: driveStorageSpace,
          parentId: null,
        });
        if (requestId !== folderListingRequestId.current) return;
        setRootStorageFolderId(anchor.rootStorageFolderId ?? null);
      } catch (err) {
        if (requestId !== folderListingRequestId.current) return;
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
      if (requestId !== folderListingRequestId.current) return;
      setFolderListing(listing);
      if (listing.rootStorageFolderId) {
        setRootStorageFolderId(listing.rootStorageFolderId);
      }
    } catch (err) {
      if (requestId !== folderListingRequestId.current) return;
      toast.error(err instanceof Error ? err.message : 'Failed to load Drive folder');
    }
  }, [
    activeFolderId,
    browseDriveFolders,
    browseEntityScopedFolders,
    driveStorageSpace,
    libraryEntityFolderScope,
  ]);

  useEffect(() => {
    folderListingRequestId.current += 1;
    setFolderListing(null);
    setProjectShellFiles([]);
    setEntityRootLinkedFiles([]);
  }, [
    libraryEntityFolderScope?.scopeEntityType,
    libraryEntityFolderScope?.scopeEntityId,
    driveStorageSpace,
    browseEntityScopedFolders,
  ]);

  useEffect(() => {
    void loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    window.localStorage.setItem(DRIVE_VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    window.localStorage.setItem(DRIVE_FILE_SORT_STORAGE_KEY, fileSort);
  }, [fileSort]);

  const refreshInsightsOperations = useCallback(async () => {
    const [summary, jobs, cleanup] = await Promise.all([
      driveApi.getDriveCleanupSummary(),
      driveApi.listDriveZipExportJobs(),
      driveApi.listDriveCleanupCandidates(),
    ]);
    setMaintenanceSummary(summary);
    setExportJobs(jobs);
    setCleanupCategories(cleanup.categories);
  }, []);

  const onExportJobsPolled = useCallback((jobs: DriveZipExportJobSummary[]) => {
    setExportJobs(jobs);
  }, []);
  useDriveExportJobsPoll(onExportJobsPolled);

  useEffect(() => {
    if (!insightsOpen) return;
    let cancelled = false;
    void refreshInsightsOperations().catch(() => {
      if (!cancelled) {
        setExportJobs([]);
        setCleanupCategories([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [insightsOpen, refreshInsightsOperations]);

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

  const currentBrowseTitle = useMemo(() => {
    const folderName = folderTrail.at(-1)?.name;
    if (folderName) return folderName;

    if (projectHubFileBrowse && projectHubSummary) {
      const focusLabel = resolveProjectHubFocusLabel(projectHubSummary, projectHubView);
      if (focusLabel) return focusLabel;
    }

    if (activeLibraryEntityLabel) return activeLibraryEntityLabel;
    if (isProjectLibraryHub && projectHubSummary?.projectName) {
      return projectHubSummary.projectName;
    }

    if (lifecycleView === 'archive' || lifecycleView === 'trash') {
      return DRIVE_LIFECYCLE_TITLES[lifecycleView];
    }

    return selectedLibrary.title;
  }, [
    activeLibraryEntityLabel,
    folderTrail,
    isProjectLibraryHub,
    lifecycleView,
    projectHubFileBrowse,
    projectHubSummary,
    projectHubView,
    selectedLibrary.title,
  ]);

  const scopedFolderListing = useMemo(
    () =>
      folderListingMatchesBrowseContext(folderListing, libraryEntityFolderScope, driveStorageSpace)
        ? folderListing
        : null,
    [driveStorageSpace, folderListing, libraryEntityFolderScope],
  );

  const libraryFilterContext = useMemo(
    () => ({
      spaceKey: selectedSpace.key,
      entityLink: systemLibraryLink
        ? {
            entityType: systemLibraryLink.entityType,
            entityId: systemLibraryLink.entityId,
          }
        : undefined,
    }),
    [selectedSpace.key, systemLibraryLink],
  );

  const files = useMemo(() => {
    if (lifecycleView === 'archive' || lifecycleView === 'trash') {
      return filterFilesForLifecycleView(rawFiles, lifecycleView);
    }
    if (browseSystemLibraryEntityRoot) {
      return [];
    }
    if (projectHubFileBrowse) {
      return rawFiles;
    }
    if (browseFolderPlacements) {
      if (!scopedFolderListing) {
        return [];
      }
      if (atProjectFolderRoot && projectShellFiles.length > 0) {
        return mergeFileAssetsById(projectShellFiles, scopedFolderListing.files);
      }
      if (atEntityScopedFolderRoot && entityRootLinkedFiles.length > 0) {
        return mergeFileAssetsById(entityRootLinkedFiles, scopedFolderListing.files);
      }
      return scopedFolderListing.files;
    }
    return rawFiles.filter((file) =>
      fileMatchesLibrary(file, selectedLibrary, libraryFilterContext),
    );
  }, [
    atEntityScopedFolderRoot,
    atProjectFolderRoot,
    browseFolderPlacements,
    browseSystemLibraryEntityRoot,
    entityRootLinkedFiles,
    lifecycleView,
    libraryFilterContext,
    projectHubFileBrowse,
    projectShellFiles,
    rawFiles,
    scopedFolderListing,
    selectedLibrary,
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

  const visibleFolderIdsForBulk = useMemo(() => {
    if (!driveActionCapabilities.showFolderBulkSelection) return [];
    return (scopedFolderListing?.folders ?? []).map((f) => f.id);
  }, [driveActionCapabilities.showFolderBulkSelection, scopedFolderListing?.folders]);

  const allVisibleBulkItemsSelected = useMemo(() => {
    const filesAll = sortedFiles.every((f) => selectedIds.includes(f.id));
    const foldersAll =
      visibleFolderIdsForBulk.length === 0 ||
      visibleFolderIdsForBulk.every((id) => selectedFolderIds.includes(id));
    return filesAll && foldersAll;
  }, [sortedFiles, selectedIds, visibleFolderIdsForBulk, selectedFolderIds]);

  const canSelectAllInView =
    (sortedFiles.length > 0 || visibleFolderIdsForBulk.length > 0) && !allVisibleBulkItemsSelected;

  const stats = useMemo(() => buildDriveStats(files), [files]);
  const libraryCounts = useMemo(() => {
    const countSource = browseFolderPlacements ? files : rawFiles;
    return buildLibraryCounts(countSource, selectedSpace.key);
  }, [browseFolderPlacements, files, rawFiles, selectedSpace.key]);

  const handlePurgeFailed = useCallback(async () => {
    setPurgeBusy(true);
    try {
      const r = await driveApi.purgeDriveCleanup('failed');
      toast.success(r.deleted === 0 ? 'Nothing to purge' : `Removed ${r.deleted} failed sessions`);
      await refreshInsightsOperations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Purge failed');
    } finally {
      setPurgeBusy(false);
    }
  }, [refreshInsightsOperations]);

  const handlePurgeExpired = useCallback(async () => {
    setPurgeBusy(true);
    try {
      const r = await driveApi.purgeDriveCleanup('expired-pending');
      toast.success(
        r.deleted === 0 ? 'Nothing to purge' : `Removed ${r.deleted} expired pending sessions`,
      );
      await refreshInsightsOperations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Purge failed');
    } finally {
      setPurgeBusy(false);
    }
  }, [refreshInsightsOperations]);

  const typedExportActions = useMemo(
    () =>
      buildDriveTypedExportActions({
        projectHubSummary,
        projectHubView,
        libraryEntityScope: libraryEntityFolderScope,
      }),
    [libraryEntityFolderScope, projectHubSummary, projectHubView],
  );

  const handleDownloadExport = useCallback(async (fileAssetId: string) => {
    try {
      const { url } = await driveApi.getFileAssetPreviewUrl(fileAssetId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not open export');
    }
  }, []);

  const handleCancelExport = useCallback(
    async (jobId: string) => {
      setBusy(true);
      try {
        await driveApi.cancelDriveZipExport(jobId);
        toast.success('Export cancelled');
        await refreshInsightsOperations();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not cancel export');
      } finally {
        setBusy(false);
      }
    },
    [refreshInsightsOperations],
  );

  const handleApplyCleanup = useCallback(
    async (kind: string, ids: string[]) => {
      if (
        !window.confirm(
          `Apply cleanup for ${ids.length} selected item(s)? This cannot be undone automatically.`,
        )
      ) {
        return;
      }
      setBusy(true);
      try {
        const result = await driveApi.applyDriveCleanup({ kind, ids });
        const skipped = result.skipped > 0 ? ` (${result.skipped} skipped)` : '';
        toast.success(`Applied ${result.applied} item(s)${skipped}`);
        await refreshInsightsOperations();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Cleanup apply failed');
      } finally {
        setBusy(false);
      }
    },
    [refreshInsightsOperations],
  );

  const handleApplyCleanupAll = useCallback(
    async (kind: string) => {
      if (
        !window.confirm(
          'Run batch cleanup for this category (up to 100 items)? This cannot be undone automatically.',
        )
      ) {
        return;
      }
      setBusy(true);
      try {
        const result = await driveApi.applyDriveCleanup({ kind, applyAll: true });
        toast.success(`Applied ${result.applied} item(s) in batch`);
        await refreshInsightsOperations();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Cleanup apply failed');
      } finally {
        setBusy(false);
      }
    },
    [refreshInsightsOperations],
  );

  const handleTypedExport = useCallback(
    async (action: DriveTypedExportAction) => {
      setBusy(true);
      try {
        await runDriveZipExportJob({
          exportKind: action.exportKind,
          exportParams: action.exportParams,
        });
        toast.success('ZIP download started');
        await refreshInsightsOperations();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not start export');
      } finally {
        setBusy(false);
      }
    },
    [refreshInsightsOperations],
  );

  const insightsOperationsProp = useMemo(() => {
    if (!insightsOpen) return null;
    return {
      busy,
      typedExportActions,
      exportJobs,
      cleanupCategories,
      onTypedExport: handleTypedExport,
      onCancelExport: handleCancelExport,
      onDownloadExport: handleDownloadExport,
      onRefresh: () => void refreshInsightsOperations(),
      onApplyCleanup: handleApplyCleanup,
      onApplyCleanupAll: handleApplyCleanupAll,
    };
  }, [
    busy,
    cleanupCategories,
    exportJobs,
    handleApplyCleanup,
    handleApplyCleanupAll,
    handleCancelExport,
    handleDownloadExport,
    handleTypedExport,
    insightsOpen,
    refreshInsightsOperations,
    typedExportActions,
  ]);

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
    if (!driveActionCapabilities.showFolderFileDragDrop || !placementFolderId) return undefined;
    return {
      sourceFolderId: placementFolderId,
      resolveDragFileIds: (file: FileAsset) =>
        selectedIds.length > 0 && selectedIds.includes(file.id) ? [...selectedIds] : [file.id],
    };
  }, [driveActionCapabilities.showFolderFileDragDrop, placementFolderId, selectedIds]);

  const folderFileDropConfig = useMemo(
    () =>
      driveActionCapabilities.showFolderFileDragDrop && placementFolderId
        ? {
            sourceFolderId: placementFolderId,
            onMoveFilesToFolder: handleDragMoveFilesToFolder,
            busy,
          }
        : undefined,
    [
      driveActionCapabilities.showFolderFileDragDrop,
      busy,
      handleDragMoveFilesToFolder,
      placementFolderId,
    ],
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

  useEffect(() => {
    goToDriveRoot();
    setProjectHubView(DRIVE_PROJECT_HUB_DEFAULT_VIEW);
  }, [libraryEntityFolderScope?.scopeEntityType, libraryEntityFolderScope?.scopeEntityId]);

  useEffect(() => {
    if (!isProjectLibraryHub || !libraryEntityFolderScope) {
      setProjectHubSummary(null);
      return;
    }
    let cancelled = false;
    void driveApi
      .getProjectDriveHubSummary(libraryEntityFolderScope.scopeEntityId)
      .then((summary) => {
        if (!cancelled) setProjectHubSummary(summary);
      })
      .catch(() => {
        if (!cancelled) setProjectHubSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isProjectLibraryHub, libraryEntityFolderScope]);

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
    if (lifecycleView === 'trash') {
      await mutateFile(() => driveApi.restoreTrashFileAsset(file.id), 'File restored');
      return;
    }
    await mutateFile(() => driveApi.restoreFileAsset(file.id), 'File restored');
  }

  async function onMoveToTrash(file: FileAsset) {
    const linkCount = file.links.filter((link) => link.unlinkedAt == null).length;
    const msg =
      linkCount > 0
        ? `This file has ${linkCount} active business link(s). Remove links first, or the server will reject the move. Move to Trash anyway?`
        : 'Move this file to Trash? You can restore it from Trash later.';
    if (!window.confirm(msg)) return;
    setBusy(true);
    try {
      await driveApi.permanentlyDeleteFileAsset(file.id);
      toast.success('File moved to Trash');
      setSelected(null);
      await load();
      await loadLifecycleCounts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Move to Trash failed');
    } finally {
      setBusy(false);
    }
  }

  function onMoveFile(file: FileAsset) {
    if (!driveActionCapabilities.canMovePlacementInTree || !placementFolderId) {
      toast.error('Open a folder in this record to move file placements.');
      return;
    }
    setFolderFilePicker({ mode: 'move', file });
  }

  function onCopyFile(file: FileAsset) {
    if (!driveActionCapabilities.canCopyIntoFolderTree) {
      toast.error('Folder copy is not available in this view.');
      return;
    }
    setFolderFilePicker({ mode: 'copy', file });
  }

  async function onUnlinkFromRecord(file: FileAsset) {
    const record = driveActionCapabilities.libraryRecordLink;
    if (!record) return;
    const link = findLibraryRecordFileLink(file, record);
    if (!link) {
      toast.error('This file is not linked to the current record.');
      return;
    }
    if (!window.confirm('Unlink this file from the current record? The file stays in Drive.')) {
      return;
    }
    await mutateFiles(() => driveApi.unlinkFileAsset(file.id, link.id), 'Unlinked from record');
    if (driveActionCapabilities.isVirtualFileBrowse) {
      setSelected(null);
    }
  }

  async function onBulkUnlinkFromRecord() {
    const record = driveActionCapabilities.libraryRecordLink;
    if (!record) return;
    const ids = await resolveBulkFileAssetIds();
    if (ids.length === 0) return;
    if (
      !window.confirm(
        ids.length === 1
          ? 'Unlink the selected file from this record?'
          : `Unlink ${ids.length} selected files from this record?`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      let unlinked = 0;
      for (const id of ids) {
        const file = files.find((item) => item.id === id);
        if (!file) continue;
        const link = findLibraryRecordFileLink(file, record);
        if (!link) continue;
        await driveApi.unlinkFileAsset(id, link.id);
        unlinked += 1;
      }
      toast.success(
        unlinked === 0 ? 'No files were linked to this record' : `Unlinked ${unlinked} file(s)`,
      );
      setSelectedIds([]);
      setSelectedFolderIds([]);
      await load();
      await loadEntityRootLinkedFiles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unlink failed');
    } finally {
      setBusy(false);
    }
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
    const ids = await resolveBulkFileAssetIds();
    if (ids.length === 0) return;
    await mutateFiles(async () => driveApi.archiveFileAssets(ids), 'Selected files archived');
  }

  async function onBulkRestore() {
    const ids = await resolveBulkFileAssetIds();
    if (ids.length === 0) return;
    if (lifecycleView === 'trash') {
      await mutateFiles(
        async () => driveApi.restoreTrashFileAssets(ids),
        'Selected files restored',
      );
      return;
    }
    await mutateFiles(async () => driveApi.restoreFileAssets(ids), 'Selected files restored');
  }

  async function onBulkMoveToTrash() {
    const ids = await resolveBulkFileAssetIds();
    if (ids.length === 0) return;
    if (
      !window.confirm(
        ids.length === 1
          ? 'Move the selected file to Trash?'
          : `Move ${ids.length} selected files to Trash?`,
      )
    ) {
      return;
    }
    await mutateFiles(
      async () => driveApi.moveFileAssetsToTrash(ids),
      'Selected files moved to Trash',
    );
  }

  function handleLifecycleViewChange(view: DriveLifecycleView) {
    setLifecycleView(view);
    setRawFiles([]);
    setSelectedIds([]);
    setSelectedFolderIds([]);
    setSystemLibraryLink(null);
    setSelected(null);
    setActiveFolderId(null);
    setFolderTrail([]);
    setLoading(view !== 'browse');
    if (view === 'browse') return;
    goToDriveRoot();
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
    const ids = await resolveBulkFileAssetIds();
    if (ids.length === 0) return;
    setBusy(true);
    try {
      for (const id of ids) {
        await driveApi.addFileToFolder(targetFolderId, id);
      }
      toast.success(
        ids.length === 1 ? 'File added to folder' : `${ids.length} files placed in folder`,
      );
      setLibraryPlacePickerOpen(false);
      setSelectedIds([]);
      setSelectedFolderIds([]);
      await load();
      if (driveStorageSpace) void loadFolders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not place files in folder');
    } finally {
      setBusy(false);
    }
  }

  async function handleZipExportForSelection() {
    if (selectedIds.length === 0 && selectedFolderIds.length === 0) return;
    setBusy(true);
    try {
      const merged = await resolveBulkFileAssetIds();
      if (merged.length === 0) {
        toast.error('No files to export in the current selection.');
        return;
      }
      if (merged.length > DRIVE_ZIP_UI_MAX_FILES) {
        toast.error(
          `ZIP export allows at most ${DRIVE_ZIP_UI_MAX_FILES} files (folders are expanded). Reduce the selection.`,
        );
        return;
      }
      await runDriveZipExportJob({ fileIds: merged });
      toast.success('ZIP download started');
      if (insightsOpen) await refreshInsightsOperations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start ZIP export');
    } finally {
      setBusy(false);
    }
  }

  async function submitCreateFolder(name: string) {
    if (!driveStorageSpace && !libraryEntityFolderScope) {
      toast.error('Open a folder context first.');
      throw new Error('No folder context.');
    }
    try {
      await driveApi.createFolder(
        libraryEntityFolderScope
          ? {
              name,
              scopeEntityType: libraryEntityFolderScope.scopeEntityType,
              scopeEntityId: libraryEntityFolderScope.scopeEntityId,
              parentId: activeFolderId,
            }
          : {
              name,
              space: driveStorageSpace!,
              parentId: activeFolderId,
            },
      );
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
    if (!driveStorageSpace && !libraryEntityFolderScope) return;
    setCreateFolderOpen(true);
  }

  async function mutateFile(action: () => Promise<FileAsset>, success: string) {
    setBusy(true);
    try {
      setSelected(await action());
      toast.success(success);
      await load();
      await loadFolders();
      await loadLifecycleCounts();
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
      setSelectedFolderIds([]);
      toast.success(success);
      await load();
      await loadFolders();
      await loadLifecycleCounts();
      if (atEntityScopedFolderRoot) {
        await loadEntityRootLinkedFiles();
      }
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

  const toggleFolderChecked = useCallback((folder: DriveFolder, checked: boolean) => {
    setSelectedFolderIds((current) => {
      const has = current.includes(folder.id);
      if (checked && !has) return [...current, folder.id];
      if (!checked && has) return current.filter((id) => id !== folder.id);
      return current;
    });
  }, []);

  const selectAllVisibleInDrive = useCallback(() => {
    setSelectedIds(sortedFiles.map((f) => f.id));
    if (browseFoldersInView) {
      setSelectedFolderIds((folderListing?.folders ?? []).map((f) => f.id));
    } else {
      setSelectedFolderIds([]);
    }
  }, [sortedFiles, browseFoldersInView, folderListing?.folders]);

  const resolveBulkFileAssetIds = useCallback(async (): Promise<string[]> => {
    const space = driveStorageSpace;
    const union = new Set(selectedIds);
    if (!space) return [...union];
    for (const folderId of selectedFolderIds) {
      const fromFolder = await collectFileAssetIdsInFolderSubtree(space, folderId);
      for (const id of fromFolder) {
        union.add(id);
      }
    }
    return [...union];
  }, [driveStorageSpace, selectedIds, selectedFolderIds]);

  useEffect(() => {
    if (!browseFoldersInView) {
      setSelectedFolderIds([]);
    }
  }, [browseFoldersInView]);

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
        const folderCache = new Map<string, string>();
        for (const uploadedFile of uploadedFiles) {
          if (browseEntityScopedFolders && placementFolderId) {
            const targetFolderId = await ensureUploadTargetFolder(uploadedFile, folderCache);
            await uploadFileToLinkedEntity(uploadedFile, systemLibraryLink, targetFolderId);
          } else {
            await uploadFileToLinkedEntity(uploadedFile, systemLibraryLink);
          }
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
        if (browseEntityScopedFolders) {
          await loadFolders();
          await loadEntityRootLinkedFiles();
          setFolderTreeVersion((v) => v + 1);
        }
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
      const folder = await driveApi.createFolder(
        libraryEntityFolderScope
          ? {
              name: part,
              scopeEntityType: libraryEntityFolderScope.scopeEntityType,
              scopeEntityId: libraryEntityFolderScope.scopeEntityId,
              parentId,
            }
          : {
              name: part,
              space: driveStorageSpace ?? 'COMPANY',
              parentId,
            },
      );
      folderCache.set(key, folder.id);
      parentId = folder.id;
    }
    return parentId ?? placementFolderId;
  }

  async function uploadFileToLinkedEntity(
    file: File,
    link: LibraryUploadLink,
    folderId?: string | null,
  ) {
    const contentType = file.type || FALLBACK_MIME_TYPE;
    const meta = buildDriveLibraryUploadSessionFields(selectedLibrary);
    const displayName = getDriveClientUploadDisplayName(file);
    const session = await driveApi.createUploadSession({
      fileName: file.name,
      contentType,
      displayName,
      entityType: link.entityType,
      entityId: link.entityId,
      folderId: folderId ?? undefined,
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
          setLifecycleView('browse');
          setSelectedIds([]);
          setSelectedFolderIds([]);
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
        insightsOperations={insightsOperationsProp}
        lifecycleView={lifecycleView}
      />

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-2xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          {!inLifecycleView ? (
            <DriveLibraries
              space={selectedSpace}
              selected={selectedLibrary}
              counts={libraryCounts}
              atStorageLibraryRoot={atStorageLibraryRoot}
              onSelect={(library) => {
                setLifecycleView('browse');
                setSelectedLibrary(library);
                setSelectedIds([]);
                setSelectedFolderIds([]);
                setSystemLibraryLink(null);
                if (library.key === 'company' || library.key === 'personal') {
                  goToDriveRoot();
                }
              }}
              sidebarCreateMenu={
                <DriveSidebarCreateMenu
                  busy={busy}
                  menuMode={sidebarCreateMenuConfig.menuMode}
                  entityContextReady={sidebarCreateMenuConfig.entityContextReady}
                  entityScopedFolders={sidebarCreateMenuConfig.entityScopedFolders}
                  onNewFolder={openCreateFolderDialog}
                  onFilesSelected={(event) => void onFolderUpload(event)}
                  onFolderUpload={(event) => void onFolderUpload(event)}
                />
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
                  : browseEntityScopedFolders && libraryEntityFolderScope
                    ? {
                        forLibraryKey: selectedLibrary.key,
                        children: (
                          <DriveSpaceFolderTree
                            key={`${folderTreeVersion}-${libraryEntityFolderScope.scopeEntityId}`}
                            space="COMPANY"
                            entityScope={libraryEntityFolderScope}
                            activeFolderId={activeFolderId}
                            folderFileDrop={folderFileDropConfig}
                            onSelectFolderPath={navigateFolderPath}
                          />
                        ),
                      }
                    : undefined
              }
            />
          ) : null}
          <DriveLifecycleNav
            view={lifecycleView}
            archiveCount={lifecycleCounts.archived}
            trashCount={lifecycleCounts.trash}
            onViewChange={handleLifecycleViewChange}
          />
        </div>

        <main className="min-w-0 space-y-4">
          {selectedIds.length + selectedFolderIds.length > 0 && !browseSystemLibraryEntityRoot && (
            <BulkActionBar
              count={selectedIds.length + selectedFolderIds.length}
              selectedFileCount={selectedIds.length}
              selectedFolderCount={selectedFolderIds.length}
              archived={lifecycleView === 'archive'}
              trashView={lifecycleView === 'trash'}
              busy={busy}
              showSelectAll={canSelectAllInView}
              onSelectAll={selectAllVisibleInDrive}
              onArchive={() => void onBulkArchive()}
              onRestore={() => void onBulkRestore()}
              onMoveToTrash={
                lifecycleView === 'archive' ? () => void onBulkMoveToTrash() : undefined
              }
              onClear={() => {
                setSelectedIds([]);
                setSelectedFolderIds([]);
              }}
              showLibraryBulkActions={
                !inLifecycleView && driveActionCapabilities.canPlaceInCompanyFolder
              }
              onPlaceInCompanyFolder={() => setLibraryPlacePickerOpen(true)}
              onUnlinkFromRecord={
                driveActionCapabilities.canUnlinkFromRecord && selectedIds.length > 0
                  ? () => void onBulkUnlinkFromRecord()
                  : undefined
              }
              onZipExport={!inLifecycleView ? () => void handleZipExportForSelection() : undefined}
            />
          )}

          {!browseSystemLibraryEntityRoot ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-0.5">
                <h2 className="text-foreground truncate text-lg font-semibold tracking-tight">
                  {currentBrowseTitle}
                </h2>
                {inLifecycleView ? (
                  <p className="text-muted-foreground text-sm">
                    {DRIVE_LIFECYCLE_HINTS[lifecycleView]}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
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
            </div>
          ) : null}

          {!inLifecycleView && isProjectLibraryHub && systemLibraryLink ? (
            <DriveProjectHubNav
              summary={projectHubSummary}
              view={projectHubView}
              onViewChange={setProjectHubView}
            />
          ) : null}

          {projectHubAwaitingFocus ? (
            <p className="text-muted-foreground text-sm">
              Select a record below to view files in this section.
            </p>
          ) : null}

          {browseSystemLibraryEntityRoot ? (
            <DriveLibraryVirtualFolderGrid
              libraryTitle={selectedLibrary.title}
              rows={mergedLibraryEntityRows}
              loading={libraryEntityFoldersLoading}
              searchQuery={search}
              viewMode={viewMode}
              onOpenRow={(row) =>
                setSystemLibraryLink({ entityType: row.entityType, entityId: row.id })
              }
            />
          ) : (
            <DriveFileSurface
              files={sortedFiles}
              folders={
                driveActionCapabilities.showFolderRowActions
                  ? (scopedFolderListing?.folders ?? [])
                  : []
              }
              loading={loading}
              viewMode={viewMode}
              selectedId={selected?.id ?? null}
              checkedIds={selectedIds}
              checkedFolderIds={selectedFolderIds}
              onSelect={setSelected}
              onToggleChecked={toggleChecked}
              onToggleFolderChecked={
                driveActionCapabilities.showFolderBulkSelection ? toggleFolderChecked : undefined
              }
              onOpenFolder={openFolder}
              onRenameFolder={
                driveActionCapabilities.showFolderRowActions
                  ? (folder) => setRenameFolderTarget(folder)
                  : undefined
              }
              onDeleteFolder={
                driveActionCapabilities.showFolderRowActions
                  ? (folder) => setDeleteFolderTarget(folder)
                  : undefined
              }
              fileMenu={{
                onOpenDetails: onPreview,
                onArchive: inLifecycleView ? undefined : onArchive,
                onRestore,
                onCopyFile:
                  !inLifecycleView && driveActionCapabilities.canCopyIntoFolderTree
                    ? onCopyFile
                    : undefined,
                onMoveFile:
                  !inLifecycleView && driveActionCapabilities.canMovePlacementInTree
                    ? onMoveFile
                    : undefined,
                onRemoveFromFolder:
                  !inLifecycleView && driveActionCapabilities.canRemoveFromFolder
                    ? onRemoveFromFolder
                    : undefined,
                onUnlinkFromRecord:
                  !inLifecycleView && driveActionCapabilities.canUnlinkFromRecord
                    ? (f) => void onUnlinkFromRecord(f)
                    : undefined,
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
          onCopyFile={
            !inLifecycleView && driveActionCapabilities.canCopyIntoFolderTree
              ? (file) => void onCopyFile(file)
              : undefined
          }
          onMoveFile={
            !inLifecycleView && driveActionCapabilities.canMovePlacementInTree
              ? (file) => void onMoveFile(file)
              : undefined
          }
          onRemoveFromFolder={
            !inLifecycleView && driveActionCapabilities.canRemoveFromFolder
              ? (file) => void onRemoveFromFolder(file)
              : undefined
          }
          onUnlinkFromRecord={
            !inLifecycleView && driveActionCapabilities.canUnlinkFromRecord
              ? (file) => void onUnlinkFromRecord(file)
              : undefined
          }
          onVersionUpload={(file, event) => void onVersionUpload(file, event)}
          onFileDetailRefresh={() => void load()}
          onPermanentDeleteSuccess={() => {
            void load();
            void loadLifecycleCounts();
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

      {(driveStorageSpace || libraryEntityFolderScope) && (
        <DriveFolderPickerDialog
          open={Boolean(folderFilePicker)}
          onOpenChange={(next) => {
            if (!next) setFolderFilePicker(null);
          }}
          space={driveStorageSpace ?? 'COMPANY'}
          entityScope={
            folderFilePicker && libraryEntityFolderScope && !driveStorageSpace
              ? libraryEntityFolderScope
              : null
          }
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
