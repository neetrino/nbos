'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type {
  CredentialQuickFilterKey,
  CredentialVaultViewMode,
} from '@/features/credentials/constants/credential-vault';
import { CREDENTIAL_VAULT_PAGE_SIZE } from '@/features/credentials/constants/credential-vault';
import { useCredentialVaultPagePreferences } from '@/features/credentials/constants/credential-vault-page-state-storage';
import { quickCategoryChipsForVaultScope } from '@/features/credentials/constants/credential-vault-categories';
import type { VaultListScope } from '@/features/credentials/components/credential-vault-table';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import {
  canCreateInVaultScope,
  type CredentialVaultScope,
  vaultScopeToListTab,
} from '@/features/credentials/vault-scope';
import { buildCredentialsVaultFilterConfigs } from '@/features/credentials/utils/build-credentials-vault-filter-configs';
import { buildCredentialVaultRecentQueryParams } from '@/features/credentials/utils/credential-vault-recent-filters';
import { useCredentialsVaultRecent } from '@/features/credentials/hooks/use-credentials-vault-recent';
import { credentialsApi } from '@/lib/api/credentials';
import { usePermission } from '@/lib/permissions';

function vaultShowsRecentStrip(
  viewMode: CredentialVaultViewMode,
  vaultListScope: VaultListScope,
): boolean {
  return vaultListScope === 'active' && (viewMode === 'list' || viewMode === 'tiles');
}

export interface CredentialDeleteTarget {
  id: string;
  name: string;
  criticality?: string;
}

export function useCredentialsVaultPage() {
  const { me } = usePermission();
  const [preferences, setPreferences] = useCredentialVaultPagePreferences();
  const { viewMode, activeTab, vaultListScope } = preferences;
  const [credentials, setCredentials] = useState<CredentialListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
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
  const [listExcludeIds, setListExcludeIds] = useState<string[]>([]);

  const recentEnabled = vaultShowsRecentStrip(viewMode, vaultListScope);
  const recentFilterInput = useMemo(
    () => ({ search, quickCategory, filters, quickFilters }),
    [search, quickCategory, filters, quickFilters],
  );
  const { recentCredentials, recentLoading, refreshRecent } = useCredentialsVaultRecent(
    recentEnabled,
    activeTab,
    recentFilterInput,
  );

  useEffect(() => {
    if (!recentEnabled || recentLoading) {
      setListExcludeIds([]);
      return;
    }
    setListExcludeIds(recentCredentials.map((credential) => credential.id));
  }, [recentEnabled, recentLoading, recentCredentials]);

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    try {
      const category =
        quickCategory ??
        (filters.category && filters.category !== 'all' ? filters.category : undefined);
      const data = await credentialsApi.getAll({
        page,
        pageSize: CREDENTIAL_VAULT_PAGE_SIZE,
        search: search || undefined,
        category,
        credentialType:
          filters.credentialType && filters.credentialType !== 'all'
            ? filters.credentialType
            : undefined,
        accessLevel:
          activeTab === 'all' && filters.accessLevel && filters.accessLevel !== 'all'
            ? filters.accessLevel
            : undefined,
        ownerId: activeTab === 'all' && quickFilters.has('mine') && me?.id ? me.id : undefined,
        needsRotation: quickFilters.has('needsRotation') ? true : undefined,
        tab: vaultListScope === 'archived' ? undefined : vaultScopeToListTab(activeTab),
        includeArchived: vaultListScope === 'archived',
        excludeIds:
          vaultListScope === 'active' && listExcludeIds.length > 0
            ? listExcludeIds.join(',')
            : undefined,
      });
      setCredentials((data.items as unknown as CredentialListItem[]) ?? []);
      setTotalPages(data.meta.totalPages);
      setTotal(data.meta.total);
    } catch {
      setCredentials([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    search,
    filters,
    quickCategory,
    quickFilters,
    activeTab,
    vaultListScope,
    page,
    me?.id,
    listExcludeIds,
  ]);

  useEffect(() => {
    setPage(1);
  }, [search, filters, quickCategory, quickFilters, activeTab, vaultListScope]);

  useEffect(() => {
    void fetchCredentials();
  }, [fetchCredentials]);

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
    setFilters({});
    setQuickCategory(null);
    setQuickFilters(new Set());
  }, []);

  const closeSheet = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setSheetCredentialId(null);
      setCreatePresetCategory(undefined);
    }
  }, []);

  const quickCategoryChips = useMemo(() => quickCategoryChipsForVaultScope(activeTab), [activeTab]);
  const filterConfigs = useMemo(() => buildCredentialsVaultFilterConfigs(activeTab), [activeTab]);
  const showCreate = vaultListScope === 'active' && canCreateInVaultScope(activeTab);
  const searchQuery = search.trim();
  const showRecentBlock =
    recentEnabled && (recentLoading || recentCredentials.length > 0 || searchQuery.length === 0);

  const setViewMode = useCallback(
    (mode: CredentialVaultViewMode) => {
      setPreferences({ viewMode: mode });
    },
    [setPreferences],
  );

  const setVaultListScope = useCallback(
    (scope: VaultListScope) => {
      setPreferences({ vaultListScope: scope });
    },
    [setPreferences],
  );

  return {
    credentials,
    loading,
    page,
    setPage,
    totalPages,
    total,
    search,
    setSearch,
    filters,
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
    fetchCredentials,
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
    recentEnabled,
    recentCredentials,
    recentLoading,
    refreshRecent,
    showRecentBlock,
    searchQuery,
  };
}
