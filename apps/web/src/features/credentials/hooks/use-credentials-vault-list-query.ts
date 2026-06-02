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
}

export function useCredentialsVaultListQuery(params: CredentialsVaultListQueryParams) {
  const isBoard = params.viewMode === 'category-board';
  const requestPageSize = isBoard ? CREDENTIAL_VAULT_BOARD_CHUNK_SIZE : params.pageSize;

  const [credentials, setCredentials] = useState<CredentialListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadedBoardPage, setLoadedBoardPage] = useState(1);
  const fetchGenerationRef = useRef(0);

  const filterKey = useMemo(
    () =>
      [
        params.search,
        params.filters.category,
        params.filters.credentialType,
        params.filters.accessLevel,
        params.filters.sort,
        params.quickCategory,
        [...params.quickFilters].sort().join(','),
        params.activeTab,
        params.vaultListScope,
        params.listSort,
        params.meId,
        params.viewMode,
        isBoard ? 'board' : `${params.page}|${params.pageSize}`,
      ].join('|'),
    [params, isBoard],
  );

  const fetchPage = useCallback(
    async (targetPage: number, mode: 'replace' | 'append') => {
      const generation = ++fetchGenerationRef.current;
      if (mode === 'replace') setLoading(true);
      else setLoadingMore(true);

      try {
        const category =
          params.quickCategory ??
          (params.filters.category && params.filters.category !== 'all'
            ? params.filters.category
            : undefined);
        const data = await credentialsApi.getAll({
          page: targetPage,
          pageSize: requestPageSize,
          search: params.search || undefined,
          category,
          credentialType:
            params.filters.credentialType && params.filters.credentialType !== 'all'
              ? params.filters.credentialType
              : undefined,
          accessLevel:
            params.activeTab === 'all' &&
            params.filters.accessLevel &&
            params.filters.accessLevel !== 'all'
              ? params.filters.accessLevel
              : undefined,
          ownerId:
            params.activeTab === 'all' && params.quickFilters.has('mine') && params.meId
              ? params.meId
              : undefined,
          needsRotation: params.quickFilters.has('needsRotation') ? true : undefined,
          tab:
            params.vaultListScope === 'archived'
              ? undefined
              : vaultScopeToListTab(params.activeTab),
          includeArchived: params.vaultListScope === 'archived',
          sort: params.listSort,
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
    [params, requestPageSize],
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

  const refetch = useCallback(() => {
    if (isBoard) {
      void fetchPage(1, 'replace');
      return;
    }
    void fetchPage(params.page, 'replace');
  }, [fetchPage, isBoard, params.page]);

  return {
    credentials,
    loading,
    loadingMore,
    total,
    totalPages,
    hasMore,
    loadMore,
    refetch,
  };
}
