'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import type {
  CredentialQuickFilterKey,
  CredentialVaultViewMode,
} from '@/features/credentials/constants/credential-vault';
import {
  CREDENTIAL_VAULT_DEFAULT_FILTER_VALUES,
  defaultCredentialVaultSortFilter,
  normalizeCredentialVaultSortFilter,
  resolveCredentialVaultListSort,
} from '@/features/credentials/constants/credential-vault-list-sort';
import { useCredentialVaultPagePreferences } from '@/features/credentials/constants/credential-vault-page-state-storage';
import { quickCategoryChipsForVaultScope } from '@/features/credentials/constants/credential-vault-categories';
import type { VaultListScope } from '@/features/credentials/components/credential-vault-table';
import {
  canCreateInVaultScope,
  type CredentialVaultScope,
} from '@/features/credentials/vault-scope';
import { buildCredentialsVaultFilterConfigs } from '@/features/credentials/utils/build-credentials-vault-filter-configs';
import { useCredentialTrashProjectFilterOptions } from '@/features/credentials/hooks/use-credential-trash-project-filter-options';
import { useCredentialVaultSelection } from '@/features/credentials/hooks/use-credential-vault-selection';
import { useCredentialVaultSheetUrlSync } from '@/features/credentials/hooks/use-credential-vault-sheet-url-sync';
import { useCredentialsVaultListQuery } from '@/features/credentials/hooks/use-credentials-vault-list-query';
import { usePermission } from '@/lib/permissions';
import type { CredentialDetail, CredentialSecretField } from '@/lib/api/credentials';
import {
  credentialsApi,
  type CredentialFolder,
  type CredentialProjectShell,
} from '@/lib/api/credentials';
import {
  canMoveCredentialsToFolder,
  filterFoldersForCredentials,
  type CredentialFolderMatchInput,
} from '@/features/credentials/utils/credential-folder-scope';

export interface CredentialDeleteTarget {
  id: string;
  name: string;
  criticality?: string;
}

export interface CredentialTileCopyTarget {
  id: string;
  criticality: string;
  field?: CredentialSecretField;
}

export function useCredentialsVaultPage() {
  const { me } = usePermission();
  const [preferences, setPreferences] = useCredentialVaultPagePreferences();
  const { viewMode, activeTab, vaultListScope, pageSize } = preferences;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>(() => ({
    ...CREDENTIAL_VAULT_DEFAULT_FILTER_VALUES,
  }));
  const [quickCategory, setQuickCategory] = useState<string | null>(null);
  const [quickFilters, setQuickFilters] = useState<Set<CredentialQuickFilterKey>>(new Set());
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [folders, setFolders] = useState<CredentialFolder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [projectShells, setProjectShells] = useState<CredentialProjectShell[]>([]);
  const [projectShellsLoading, setProjectShellsLoading] = useState(false);
  const [sheetFolderOptions, setSheetFolderOptions] = useState<CredentialFolder[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetCredentialId, setSheetCredentialId] = useState<string | null>(null);
  const [createPresetCategory, setCreatePresetCategory] = useState<string | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<CredentialDeleteTarget | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<CredentialDeleteTarget | null>(null);
  const [tileCopyTarget, setTileCopyTarget] = useState<CredentialTileCopyTarget | null>(null);
  const [passwordFlashCredentialId, setPasswordFlashCredentialId] = useState<string | null>(null);

  const listSort = useMemo(
    () => resolveCredentialVaultListSort(filters, vaultListScope),
    [filters, vaultListScope],
  );

  const filterValuesForUi = useMemo(
    () => ({
      ...filters,
      sort: normalizeCredentialVaultSortFilter(filters.sort, vaultListScope),
    }),
    [filters, vaultListScope],
  );

  const isProjectFoldersMode = activeTab === 'project' && viewMode === 'folders';
  const { projectFilterOptions } = useCredentialTrashProjectFilterOptions(
    vaultListScope === 'trash',
  );

  const listQuery = useCredentialsVaultListQuery({
    viewMode,
    page,
    pageSize,
    search,
    filters,
    quickCategory,
    quickFilters,
    activeTab,
    vaultListScope,
    listSort,
    meId: me?.id,
    folderId: activeFolderId,
    withoutFolder: viewMode === 'folders' && !activeFolderId && !isProjectFoldersMode,
    projectId: isProjectFoldersMode ? activeProjectId : null,
  });

  const { credentials, loading, loadingMore, total, totalPages, hasMore, loadMore, refetch } =
    listQuery;

  const { pushOpenCredentialToUrl, stripOpenCredentialFromUrl } = useCredentialVaultSheetUrlSync({
    credentials,
    loading,
    setSheetCredentialId,
    setSheetOpen,
  });

  const sheetInitialItem = useMemo(
    () => credentials.find((c) => c.id === sheetCredentialId) ?? null,
    [credentials, sheetCredentialId],
  );

  const selectionEnabled = viewMode === 'list' || viewMode === 'tiles' || viewMode === 'folders';
  const pageCredentialIds = useMemo(() => credentials.map((c) => c.id), [credentials]);
  const selectionResetKey = `${activeTab}|${vaultListScope}|${page}|${pageSize}|${search}|${viewMode}`;
  const selection = useCredentialVaultSelection(
    selectionEnabled,
    pageCredentialIds,
    selectionResetKey,
  );

  const [folderDropBusy, setFolderDropBusy] = useState(false);
  const [draggingCredentialIds, setDraggingCredentialIds] = useState<string[]>([]);

  const pageResetKey = `${search}|${JSON.stringify(filters)}|${quickCategory}|${[...quickFilters].sort().join(',')}|${activeFolderId}|${activeProjectId}|${activeTab}|${vaultListScope}|${viewMode}|${pageSize}`;
  const [trackedPageResetKey, setTrackedPageResetKey] = useState(pageResetKey);

  if (trackedPageResetKey !== pageResetKey) {
    setTrackedPageResetKey(pageResetKey);
    setPage(1);
  }

  const fetchFolders = useCallback(async () => {
    if (vaultListScope === 'trash') {
      setFolders([]);
      return;
    }
    if (isProjectFoldersMode && !activeProjectId) {
      setFolders([]);
      return;
    }
    setFoldersLoading(true);
    try {
      const data = await credentialsApi.listFolders({
        scope: activeTab.toUpperCase(),
        projectId: isProjectFoldersMode && activeProjectId ? activeProjectId : undefined,
      });
      setFolders(data.folders);
    } catch {
      setFolders([]);
    } finally {
      setFoldersLoading(false);
    }
  }, [activeTab, activeProjectId, isProjectFoldersMode, vaultListScope]);

  const fetchProjectShells = useCallback(async () => {
    if (vaultListScope === 'trash') {
      setProjectShells([]);
      return;
    }
    if (!isProjectFoldersMode) {
      setProjectShells([]);
      return;
    }
    setProjectShellsLoading(true);
    try {
      const data = await credentialsApi.listProjectShells();
      setProjectShells(data.shells);
    } catch {
      setProjectShells([]);
    } finally {
      setProjectShellsLoading(false);
    }
  }, [isProjectFoldersMode, vaultListScope]);

  useEffect(() => {
    void fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    void fetchProjectShells();
  }, [fetchProjectShells]);

  const fetchSheetFolderOptions = useCallback(async () => {
    try {
      const data = await credentialsApi.listFolders({ scope: 'ALL' });
      setSheetFolderOptions(data.folders);
    } catch {
      setSheetFolderOptions([]);
    }
  }, []);

  useEffect(() => {
    if (!sheetOpen) return;
    void fetchSheetFolderOptions();
  }, [fetchSheetFolderOptions, sheetOpen]);

  const openCreate = useCallback(
    (category?: string) => {
      setCreatePresetCategory(category);
      setSheetCredentialId(null);
      stripOpenCredentialFromUrl();
      setSheetOpen(true);
    },
    [stripOpenCredentialFromUrl],
  );

  const openCredential = useCallback(
    (id: string) => {
      setSheetCredentialId(id);
      setSheetOpen(true);
      pushOpenCredentialToUrl(id);
    },
    [pushOpenCredentialToUrl],
  );

  const copyToClipboard = useCallback((text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success('Copied');
  }, []);

  const toggleQuickFilter = useCallback((key: CredentialQuickFilterKey) => {
    setQuickFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const navigateFolder = useCallback((folderId: string | null) => {
    setActiveFolderId(folderId);
  }, []);

  const openFolder = useCallback((folderId: string) => {
    setActiveFolderId(folderId);
  }, []);

  const navigateProject = useCallback((projectId: string | null) => {
    setActiveProjectId(projectId);
    setActiveFolderId(null);
  }, []);

  const openProject = useCallback((projectId: string) => {
    setActiveProjectId(projectId);
    setActiveFolderId(null);
  }, []);

  const activeProject = useMemo(
    () => projectShells.find((shell) => shell.id === activeProjectId) ?? null,
    [activeProjectId, projectShells],
  );

  const createFolder = useCallback(
    async (name: string) => {
      const folder = await credentialsApi.createFolder({
        name,
        scope: activeTab.toUpperCase(),
        parentId: activeFolderId,
        projectId: isProjectFoldersMode ? activeProjectId : undefined,
      });
      setFolders((prev) => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)));
      return folder;
    },
    [activeTab, activeFolderId, activeProjectId, isProjectFoldersMode],
  );

  const renameFolder = useCallback(async (folderId: string, name: string) => {
    const folder = await credentialsApi.updateFolder(folderId, { name });
    setFolders((prev) => prev.map((item) => (item.id === folderId ? folder : item)));
  }, []);

  const deleteFolder = useCallback(
    async (folderId: string) => {
      await credentialsApi.deleteFolder(folderId);
      setFolders((prev) => prev.filter((folder) => folder.id !== folderId));
      if (activeFolderId === folderId) {
        setActiveFolderId(null);
      }
      void refetch({ silent: true });
    },
    [activeFolderId, refetch],
  );

  const removeFolderGrouping = useCallback(
    async (folderId: string) => {
      await credentialsApi.removeFolderGrouping(folderId);
      setFolders((prev) => prev.filter((folder) => folder.id !== folderId));
      if (activeFolderId === folderId) {
        setActiveFolderId(null);
      }
      void refetch({ silent: true });
    },
    [activeFolderId, refetch],
  );

  const resolveCredentialForFolder = useCallback(
    (credentialId: string): CredentialFolderMatchInput | null => {
      const credential = credentials.find((item) => item.id === credentialId);
      if (!credential) return null;
      return {
        accessLevel: credential.accessLevel,
        projectId: credential.project?.id ?? null,
      };
    },
    [credentials],
  );

  const moveCredentialsToFolder = useCallback(
    async (credentialIds: string[], folderId: string) => {
      const folder =
        sheetFolderOptions.find((item) => item.id === folderId) ??
        folders.find((item) => item.id === folderId);
      if (!folder) {
        toast.error('Folder not found');
        return;
      }
      if (!canMoveCredentialsToFolder(credentialIds, folder, resolveCredentialForFolder)) {
        toast.error('Credential and folder must be in the same section');
        return;
      }

      setFolderDropBusy(true);
      try {
        const result = await credentialsApi.bulkAddToFolder({ credentialIds, folderId });
        const skipped = result.skipped > 0 ? ` (${result.skipped} skipped)` : '';
        toast.success(
          `Moved ${result.succeeded} credential${result.succeeded === 1 ? '' : 's'}${skipped}`,
        );
        if (result.succeeded > 0) {
          selection.clearSelection();
          void refetch({ silent: true });
          void fetchFolders();
          void fetchProjectShells();
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Move to folder failed');
      } finally {
        setFolderDropBusy(false);
      }
    },
    [
      fetchFolders,
      fetchProjectShells,
      folders,
      refetch,
      resolveCredentialForFolder,
      selection,
      sheetFolderOptions,
    ],
  );

  const credentialFolderDragConfig = useMemo(() => {
    if (viewMode !== 'folders' || vaultListScope !== 'active') return undefined;
    return {
      resolveDragCredentialIds: (credentialId: string) =>
        selection.selectionActive && selection.isSelected(credentialId)
          ? selection.selectedIdList
          : [credentialId],
      onDragStart: (credentialIds: readonly string[]) =>
        setDraggingCredentialIds([...credentialIds]),
      onDragEnd: () => setDraggingCredentialIds([]),
    };
  }, [viewMode, vaultListScope, selection]);

  const bulkFolderOptions = useMemo(() => {
    const selected = selection.selectedIdList
      .map((id) => credentials.find((item) => item.id === id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item) => ({
        accessLevel: item.accessLevel,
        projectId: item.project?.id ?? null,
      }));
    return filterFoldersForCredentials(sheetFolderOptions, selected);
  }, [credentials, selection.selectedIdList, sheetFolderOptions]);

  const credentialFolderDropConfig = useMemo(() => {
    if (viewMode !== 'folders' || vaultListScope !== 'active') return undefined;
    return {
      busy: folderDropBusy,
      draggingCredentialIds,
      resolveCredential: resolveCredentialForFolder,
      onMoveCredentialsToFolder: moveCredentialsToFolder,
    };
  }, [
    draggingCredentialIds,
    folderDropBusy,
    moveCredentialsToFolder,
    resolveCredentialForFolder,
    vaultListScope,
    viewMode,
  ]);

  const setCredentialFavorite = useCallback(
    async (id: string, favorite: boolean) => {
      const previous = credentials.find((credential) => credential.id === id)?.isFavorite ?? false;
      listQuery.setCredentials((items) =>
        items.map((item) => (item.id === id ? { ...item, isFavorite: favorite } : item)),
      );
      try {
        await credentialsApi.setFavorite(id, favorite);
        toast.success(favorite ? 'Added to favorites' : 'Removed from favorites');
        void refetch({ silent: true });
      } catch {
        listQuery.setCredentials((items) =>
          items.map((item) => (item.id === id ? { ...item, isFavorite: previous } : item)),
        );
        toast.error('Favorite could not be updated');
      }
    },
    [credentials, listQuery, refetch],
  );

  const handleTabChange = useCallback(
    (tab: CredentialVaultScope) => {
      setPreferences({ activeTab: tab });
      setQuickCategory(null);
      setActiveFolderId(null);
      setActiveProjectId(null);
      if (tab !== 'all') {
        setFilters((prev) => {
          const next = { ...prev };
          delete next.accessLevel;
          return next;
        });
        setQuickFilters((prev) => {
          const next = new Set(prev);
          next.delete('mine');
          return next;
        });
      }
    },
    [setPreferences],
  );

  const clearFilters = useCallback(() => {
    setFilters({
      ...CREDENTIAL_VAULT_DEFAULT_FILTER_VALUES,
      sort: defaultCredentialVaultSortFilter(vaultListScope),
    });
    setQuickCategory(null);
    setQuickFilters(new Set());
  }, [vaultListScope]);

  const restoreCredential = useCallback(
    async (id: string) => {
      try {
        await credentialsApi.restore(id);
        toast.success('Returned to vault (unfiled)');
        setSheetOpen(false);
        setSheetCredentialId(null);
        stripOpenCredentialFromUrl();
        void refetch();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Restore failed');
      }
    },
    [refetch, stripOpenCredentialFromUrl],
  );

  const handleCredentialCreated = useCallback(
    (created: CredentialDetail) => {
      setSheetCredentialId(created.id);
      setCreatePresetCategory(undefined);
      pushOpenCredentialToUrl(created.id);
      void refetch();
    },
    [pushOpenCredentialToUrl, refetch],
  );

  const closeSheet = useCallback(
    (open: boolean) => {
      setSheetOpen(open);
      if (!open) {
        setSheetCredentialId(null);
        setCreatePresetCategory(undefined);
        stripOpenCredentialFromUrl();
      }
    },
    [stripOpenCredentialFromUrl],
  );

  const quickCategoryChips = useMemo(() => quickCategoryChipsForVaultScope(activeTab), [activeTab]);
  const filterConfigs = useMemo(
    () => buildCredentialsVaultFilterConfigs(activeTab, vaultListScope, projectFilterOptions),
    [activeTab, projectFilterOptions, vaultListScope],
  );
  const showCreate = vaultListScope === 'active' && canCreateInVaultScope(activeTab);
  const showPagedFooter = viewMode === 'list' || viewMode === 'tiles' || viewMode === 'folders';

  const setViewMode = useCallback(
    (mode: CredentialVaultViewMode) => {
      if (mode !== 'folders') {
        setActiveFolderId(null);
        setActiveProjectId(null);
      }
      setPreferences({ viewMode: mode });
    },
    [setPreferences],
  );

  const setVaultListScope = useCallback(
    (scope: VaultListScope) => {
      if (scope === 'trash') {
        setActiveFolderId(null);
        setActiveProjectId(null);
        setFolders([]);
        setProjectShells([]);
        setPreferences({
          vaultListScope: scope,
          viewMode: viewMode === 'folders' ? 'list' : viewMode,
        });
      } else {
        setPreferences({ vaultListScope: scope });
      }
      setFilters((prev) => ({
        ...prev,
        sort: defaultCredentialVaultSortFilter(scope),
        project: 'all',
      }));
    },
    [setPreferences, viewMode],
  );

  return {
    credentials,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    page,
    setPage,
    pageSize,
    totalPages,
    total,
    showPagedFooter,
    folders,
    foldersLoading,
    activeFolderId,
    activeProjectId,
    activeProject,
    isProjectFoldersMode,
    projectShells,
    projectShellsLoading,
    navigateFolder,
    openFolder,
    navigateProject,
    openProject,
    createFolder,
    renameFolder,
    deleteFolder,
    removeFolderGrouping,
    fetchFolders,
    fetchProjectShells,
    fetchSheetFolderOptions,
    sheetFolderOptions,
    search,
    setSearch,
    filters,
    filterValuesForUi,
    setFilters,
    quickCategory,
    setQuickCategory,
    quickFilters,
    viewMode,
    setViewMode,
    activeTab,
    vaultListScope,
    setVaultListScope,
    sheetOpen,
    sheetCredentialId,
    sheetInitialItem,
    createPresetCategory,
    deleteTarget,
    setDeleteTarget,
    purgeTarget,
    setPurgeTarget,
    tileCopyTarget,
    setTileCopyTarget,
    passwordFlashCredentialId,
    setPasswordFlashCredentialId,
    fetchCredentials: refetch,
    openCreate,
    openCredential,
    copyToClipboard,
    setCredentialFavorite,
    toggleQuickFilter,
    handleTabChange,
    clearFilters,
    closeSheet,
    restoreCredential,
    handleCredentialCreated,
    quickCategoryChips,
    filterConfigs,
    showCreate,
    selectionEnabled,
    selection,
    pageCredentialIds,
    credentialFolderDragConfig,
    credentialFolderDropConfig,
    bulkFolderOptions,
  };
}
