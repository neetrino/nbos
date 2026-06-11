'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CredentialVaultViewMode } from '@/features/credentials/constants/credential-vault';
import {
  CREDENTIAL_VAULT_BOARD_CHUNK_SIZE,
  type CredentialVaultPageSizeOption,
} from '@/features/credentials/constants/credential-vault-pagination';
import type { CredentialQuickFilterKey } from '@/features/credentials/constants/credential-vault';
import type { CredentialVaultListSort } from '@/features/credentials/constants/credential-vault-list-sort';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import type { CredentialVaultScope } from '@/features/credentials/vault-scope';
import { vaultScopeToListTab } from '@/features/credentials/vault-scope';
import type { VaultListScope } from '@/features/credentials/components/credential-vault-table';
import { credentialsApi } from '@/lib/api/credentials';

export interface CredentialsVaultListQueryParams {
  viewMode: CredentialVaultViewMode;
  page: number;
  pageSize: CredentialVaultPageSizeOption;
  search: string;
  filters: Record<string, string>;
  quickCategory: string | null;
  quickFilters: Set<CredentialQuickFilterKey>;
  activeTab: CredentialVaultScope;
  vaultListScope: VaultListScope;
  listSort: CredentialVaultListSort;
  meId?: string;
  folderId?: string | null;
  withoutFolder?: boolean;
}

export function useCredentialsVaultListQuery(params: CredentialsVaultListQueryParams) {
  const isBoard = params.viewMode === 'category-board';
  const requestPageSize = isBoard ? CREDENTIAL_VAULT_BOARD_CHUNK_SIZE : params.pageSize;
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const [credentials, setCredentials] = useState<CredentialListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadedBoardPage, setLoadedBoardPage] = useState(1);
  const fetchGenerationRef = useRef(0);

  const quickFiltersKey = useMemo(
    () => [...params.quickFilters].sort().join(','),
    [params.quickFilters],
  );

  /** Only affects API when quick filter "mine" is on; avoid refetch when `/api/me` arrives. */
  const ownerIdKey = params.quickFilters.has('mine') ? (params.meId ?? '') : '';

  const filterKey = useMemo(
    () =>
      [
        params.search,
        params.filters.category,
        params.filters.credentialType,
        params.filters.accessLevel,
        params.filters.sort,
        ...(isBoard ? [] : [params.quickCategory ?? '']),
        quickFiltersKey,
        params.activeTab,
        params.vaultListScope,
        params.listSort,
        ownerIdKey,
        params.folderId ?? '',
        params.withoutFolder ? 'without-folder' : '',
        params.viewMode,
        isBoard ? 'board' : `${params.page}|${params.pageSize}`,
      ].join('|'),
    [
      params.search,
      params.filters.category,
      params.filters.credentialType,
      params.filters.accessLevel,
      params.filters.sort,
      params.quickCategory,
      quickFiltersKey,
      params.activeTab,
      params.vaultListScope,
      params.listSort,
      ownerIdKey,
      params.folderId,
      params.withoutFolder,
      params.viewMode,
      isBoard,
      params.page,
      params.pageSize,
    ],
  );

  const fetchPage = useCallback(
    async (targetPage: number, mode: 'replace' | 'append', options?: { silent?: boolean }) => {
      const p = paramsRef.current;
      const generation = ++fetchGenerationRef.current;
      if (mode === 'replace' && !options?.silent) setLoading(true);
      else if (mode === 'append') setLoadingMore(true);

      try {
        const isBoardView = p.viewMode === 'category-board';
        const category = isBoardView
          ? p.filters.category && p.filters.category !== 'all'
            ? p.filters.category
            : undefined
          : (p.quickCategory ??
            (p.filters.category && p.filters.category !== 'all' ? p.filters.category : undefined));
        const data = await credentialsApi.getAll({
          page: targetPage,
          pageSize: requestPageSize,
          search: p.search || undefined,
          category,
          credentialType:
            p.filters.credentialType && p.filters.credentialType !== 'all'
              ? p.filters.credentialType
              : undefined,
          accessLevel:
            p.activeTab === 'all' && p.filters.accessLevel && p.filters.accessLevel !== 'all'
              ? p.filters.accessLevel
              : undefined,
          ownerId:
            p.activeTab === 'all' && p.quickFilters.has('mine') && p.meId ? p.meId : undefined,
          needsRotation: p.quickFilters.has('needsRotation') ? true : undefined,
          favoritesOnly: p.quickFilters.has('favorites') ? true : undefined,
          folderId: p.viewMode === 'folders' && p.folderId ? p.folderId : undefined,
          withoutFolder:
            p.viewMode === 'folders' && !p.folderId && p.withoutFolder ? true : undefined,
          tab: p.vaultListScope === 'archived' ? undefined : vaultScopeToListTab(p.activeTab),
          includeArchived: p.vaultListScope === 'archived',
          sort: p.listSort,
        });
        if (generation !== fetchGenerationRef.current) return;

        const items = (data.items as unknown as CredentialListItem[]) ?? [];
        setCredentials((prev) => (mode === 'append' ? [...prev, ...items] : items));
        setTotal(data.meta.total);
        setTotalPages(data.meta.totalPages);
        setLoadedBoardPage(targetPage);
      } catch {
        if (generation !== fetchGenerationRef.current) return;
        if (mode === 'replace') {
          setCredentials([]);
          setTotal(0);
          setTotalPages(1);
          setLoadedBoardPage(1);
        }
      } finally {
        if (generation === fetchGenerationRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [requestPageSize],
  );

  useEffect(() => {
    if (isBoard) {
      void fetchPage(1, 'replace');
      return;
    }
    void fetchPage(params.page, 'replace');
  }, [filterKey, isBoard, fetchPage, params.page]);

  const hasMore = isBoard && credentials.length < total;

  const loadMore = useCallback(() => {
    if (!isBoard || loading || loadingMore || !hasMore) return;
    void fetchPage(loadedBoardPage + 1, 'append');
  }, [fetchPage, hasMore, isBoard, loadedBoardPage, loading, loadingMore]);

  const refetch = useCallback(
    (options?: { silent?: boolean }) => {
      if (isBoard) {
        void fetchPage(1, 'replace', options);
        return;
      }
      void fetchPage(params.page, 'replace', options);
    },
    [fetchPage, isBoard, params.page],
  );

  return {
    credentials,
    setCredentials,
    loading,
    loadingMore,
    total,
    totalPages,
    hasMore,
    loadMore,
    refetch,
  };
}
