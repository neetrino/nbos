'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import {
  isCredentialVaultPageSizeOption,
  type CredentialVaultPageSizeOption,
} from '@/features/credentials/constants/credential-vault-pagination';
import { useCredentialVaultPagePreferences } from '@/features/credentials/constants/credential-vault-page-state-storage';
import { quickCategoryChipsForVaultScope } from '@/features/credentials/constants/credential-vault-categories';
import type { VaultListScope } from '@/features/credentials/components/credential-vault-table';
import {
  canCreateInVaultScope,
  type CredentialVaultScope,
} from '@/features/credentials/vault-scope';
import { buildCredentialsVaultFilterConfigs } from '@/features/credentials/utils/build-credentials-vault-filter-configs';
import { useCredentialVaultSelection } from '@/features/credentials/hooks/use-credential-vault-selection';
import { useCredentialsVaultListQuery } from '@/features/credentials/hooks/use-credentials-vault-list-query';
import { usePermission } from '@/lib/permissions';

export interface CredentialDeleteTarget {
  id: string;
  name: string;
  criticality?: string;
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
  const [visibleLogins, setVisibleLogins] = useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetCredentialId, setSheetCredentialId] = useState<string | null>(null);
  const [createPresetCategory, setCreatePresetCategory] = useState<string | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<CredentialDeleteTarget | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<CredentialDeleteTarget | null>(null);
  const [tileCopyCredentialId, setTileCopyCredentialId] = useState<string | null>(null);
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
  });

  const { credentials, loading, loadingMore, total, totalPages, hasMore, loadMore, refetch } =
    listQuery;

  const selectionEnabled = viewMode === 'list' || viewMode === 'tiles';
  const pageCredentialIds = useMemo(() => credentials.map((c) => c.id), [credentials]);
  const selectionResetKey = `${activeTab}|${vaultListScope}|${page}|${pageSize}|${search}|${viewMode}`;
  const selection = useCredentialVaultSelection(
    selectionEnabled,
    pageCredentialIds,
    selectionResetKey,
  );

  useEffect(() => {
    setPage(1);
  }, [search, filters, quickCategory, quickFilters, activeTab, vaultListScope, viewMode, pageSize]);

  const openCreate = useCallback((category?: string) => {
    setCreatePresetCategory(category);
    setSheetCredentialId(null);
    setSheetOpen(true);
  }, []);

  const openCredential = useCallback((id: string) => {
    setSheetCredentialId(id);
    setSheetOpen(true);
  }, []);

  const toggleLogin = useCallback((id: string) => {
    setVisibleLogins((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

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

  const handleTabChange = useCallback(
    (tab: CredentialVaultScope) => {
      setPreferences({ activeTab: tab });
      setQuickCategory(null);
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

  const closeSheet = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setSheetCredentialId(null);
      setCreatePresetCategory(undefined);
    }
  }, []);

  const setPageSize = useCallback(
    (size: CredentialVaultPageSizeOption) => {
      if (!isCredentialVaultPageSizeOption(size)) return;
      setPreferences({ pageSize: size });
    },
    [setPreferences],
  );

  const quickCategoryChips = useMemo(() => quickCategoryChipsForVaultScope(activeTab), [activeTab]);
  const filterConfigs = useMemo(
    () => buildCredentialsVaultFilterConfigs(activeTab, vaultListScope),
    [activeTab, vaultListScope],
  );
  const showCreate = vaultListScope === 'active' && canCreateInVaultScope(activeTab);
  const showPagedFooter = viewMode === 'list' || viewMode === 'tiles';

  const setViewMode = useCallback(
    (mode: CredentialVaultViewMode) => {
      setPreferences({ viewMode: mode });
    },
    [setPreferences],
  );

  const setVaultListScope = useCallback(
    (scope: VaultListScope) => {
      setPreferences({ vaultListScope: scope });
      setFilters((prev) => ({
        ...prev,
        sort: defaultCredentialVaultSortFilter(scope),
      }));
    },
    [setPreferences],
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
    setPageSize,
    totalPages,
    total,
    showPagedFooter,
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
    visibleLogins,
    activeTab,
    vaultListScope,
    setVaultListScope,
    sheetOpen,
    sheetCredentialId,
    createPresetCategory,
    deleteTarget,
    setDeleteTarget,
    purgeTarget,
    setPurgeTarget,
    tileCopyCredentialId,
    setTileCopyCredentialId,
    passwordFlashCredentialId,
    setPasswordFlashCredentialId,
    fetchCredentials: refetch,
    openCreate,
    openCredential,
    toggleLogin,
    copyToClipboard,
    toggleQuickFilter,
    handleTabChange,
    clearFilters,
    closeSheet,
    quickCategoryChips,
    filterConfigs,
    showCreate,
    selectionEnabled,
    selection,
    pageCredentialIds,
  };
}
