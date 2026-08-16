'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CREDENTIAL_VAULT_KANBAN_COLUMN_PAGE_SIZE } from '@/features/credentials/constants/credential-vault-pagination';
import {
  categoriesForVaultScope,
  categoryBoardColumnsForQuickFilter,
} from '@/features/credentials/constants/credential-vault-categories';
import { useCredentialsCategoryColumnBoard } from '@/features/credentials/hooks/use-credentials-category-column-board';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import {
  buildCredentialsVaultListRequest,
  resolveCredentialsVaultListCategory,
  type CredentialsVaultListQueryParams,
} from '@/features/credentials/utils/build-credentials-vault-list-request';
import { credentialsApi } from '@/lib/api/credentials';

export type { CredentialsVaultListQueryParams };

function emptyBoardPage(pageSize: number) {
  return {
    items: [] as CredentialListItem[],
    meta: { total: 0, page: 1, pageSize, totalPages: 0 },
  };
}

export function useCredentialsVaultListQuery(params: CredentialsVaultListQueryParams) {
  const isBoard = params.viewMode === 'category-board';
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const [credentials, setCredentials] = useState<CredentialListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const fetchGenerationRef = useRef(0);

  const quickFiltersKey = useMemo(
    () => [...params.quickFilters].sort().join(','),
    [params.quickFilters],
  );
  const ownerIdKey = params.quickFilters.has('mine') ? (params.meId ?? '') : '';

  const filterKey = useMemo(
    () =>
      [
        params.search,
        params.filters.category,
        params.filters.credentialType,
        params.filters.accessLevel,
        params.filters.project,
        params.filters.sort,
        params.quickCategory ?? '',
        quickFiltersKey,
        params.activeTab,
        params.vaultListScope,
        params.listSort,
        ownerIdKey,
        params.folderId ?? '',
        params.withoutFolder ? 'without-folder' : '',
        params.projectId ?? '',
        params.viewMode,
        isBoard ? 'board' : `${params.page}|${params.pageSize}`,
      ].join('|'),
    [
      params.search,
      params.filters.category,
      params.filters.credentialType,
      params.filters.accessLevel,
      params.filters.project,
      params.filters.sort,
      params.quickCategory,
      quickFiltersKey,
      params.activeTab,
      params.vaultListScope,
      params.listSort,
      ownerIdKey,
      params.folderId,
      params.withoutFolder,
      params.projectId,
      params.viewMode,
      isBoard,
      params.page,
      params.pageSize,
    ],
  );

  const boardColumnKeys = useMemo(() => {
    const chips = categoriesForVaultScope(params.activeTab);
    return categoryBoardColumnsForQuickFilter(chips, params.quickCategory).map((col) => col.value);
  }, [params.activeTab, params.quickCategory]);

  const fetchBoardPage = useCallback(
    async (args: { page: number; pageSize: number; columnKey: string }) => {
      const p = paramsRef.current;
      const filterCategory =
        p.filters.category && p.filters.category !== 'all' ? p.filters.category : undefined;
      if (filterCategory && filterCategory !== args.columnKey) {
        return emptyBoardPage(args.pageSize);
      }
      const data = await credentialsApi.getAll(
        buildCredentialsVaultListRequest(p, {
          page: args.page,
          pageSize: args.pageSize,
          category: args.columnKey,
        }),
      );
      return {
        items: (data.items as unknown as CredentialListItem[]) ?? [],
        meta: data.meta,
      };
    },
    [],
  );

  const {
    items: boardItems,
    columnMeta,
    total: boardTotal,
    loading: boardLoading,
    reload: reloadBoard,
    loadMoreColumn,
    setItems: setBoardItems,
  } = useCredentialsCategoryColumnBoard({
    enabled: isBoard,
    columnKeys: boardColumnKeys,
    pageSize: CREDENTIAL_VAULT_KANBAN_COLUMN_PAGE_SIZE,
    queryKey: filterKey,
    fetchPage: fetchBoardPage,
  });

  const fetchPage = useCallback(async (targetPage: number, options?: { silent?: boolean }) => {
    const p = paramsRef.current;
    const generation = ++fetchGenerationRef.current;
    if (!options?.silent) setLoading(true);

    try {
      const skipProjectRoot = p.viewMode === 'folders' && p.activeTab === 'project' && !p.projectId;
      if (skipProjectRoot) {
        if (generation !== fetchGenerationRef.current) return;
        setCredentials([]);
        setTotal(0);
        setTotalPages(1);
        return;
      }

      const data = await credentialsApi.getAll(
        buildCredentialsVaultListRequest(p, {
          page: targetPage,
          pageSize: p.pageSize,
          category: resolveCredentialsVaultListCategory(p),
        }),
      );
      if (generation !== fetchGenerationRef.current) return;

      setCredentials((data.items as unknown as CredentialListItem[]) ?? []);
      setTotal(data.meta.total);
      setTotalPages(data.meta.totalPages);
    } catch {
      if (generation !== fetchGenerationRef.current) return;
      setCredentials([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      if (generation === fetchGenerationRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isBoard) return;
    void fetchPage(params.page);
  }, [filterKey, isBoard, fetchPage, params.page]);

  const refetch = useCallback(
    (options?: { silent?: boolean }) => {
      if (isBoard) {
        void reloadBoard(options);
        return;
      }
      void fetchPage(params.page, options);
    },
    [fetchPage, isBoard, params.page, reloadBoard],
  );

  return {
    credentials: isBoard ? boardItems : credentials,
    setCredentials: isBoard ? setBoardItems : setCredentials,
    loading: isBoard ? boardLoading : loading,
    total: isBoard ? boardTotal : total,
    totalPages,
    columnMeta,
    loadMoreColumn,
    refetch,
  };
}
