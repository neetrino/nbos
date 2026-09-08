import { useCallback, useEffect, useRef, useState } from 'react';
import { productsApi, type Product } from '@/lib/api/products';
import {
  useProductsHubPagePreferences,
  type ProductsHubTab,
  type ProductsHubViewMode,
} from '@/features/projects/constants/products-hub-page-preferences-storage';
import {
  PROJECTS_HUB_PAGE_SIZE,
  PROJECTS_HUB_SEARCH_DEBOUNCE_MS,
} from '@/features/projects/constants/projects-hub-page-constants';
import {
  appendUniqueProjects,
  uniqueProjectsById,
} from '@/features/projects/utils/projects-hub-append-items';
import { projectsHubHasMore } from '@/features/projects/utils/projects-hub-has-more';
import { productsHubTabToListParams } from '@/features/projects/utils/products-hub-directory-query';

export function useProductsHubDirectory() {
  const [hubPrefs, setHubPrefs] = useProductsHubPagePreferences();
  const { activeTab, viewMode } = hubPrefs;
  const setActiveTab = useCallback(
    (tab: ProductsHubTab) => setHubPrefs({ activeTab: tab }),
    [setHubPrefs],
  );
  const setViewMode = useCallback(
    (next: ProductsHubViewMode) => setHubPrefs({ viewMode: next }),
    [setHubPrefs],
  );

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const pageRef = useRef(1);
  const fetchLockRef = useRef(false);

  useEffect(() => {
    const handle = setTimeout(
      () => setDebouncedSearch(searchInput.trim()),
      PROJECTS_HUB_SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(handle);
  }, [searchInput]);

  const fetchPage = useCallback(
    async (nextPage: number) => {
      const requestId = ++requestIdRef.current;
      fetchLockRef.current = true;
      if (nextPage === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const data = await productsApi.getAll({
          page: nextPage,
          pageSize: PROJECTS_HUB_PAGE_SIZE,
          search: debouncedSearch || undefined,
          ...productsHubTabToListParams(activeTab),
        });
        if (requestId !== requestIdRef.current) return;
        pageRef.current = nextPage;
        setTotal(data.meta.total);
        setItems((prev) =>
          nextPage === 1 ? uniqueProjectsById(data.items) : appendUniqueProjects(prev, data.items),
        );
        setError(null);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setError('Products could not be loaded. Check your connection and try again.');
      } finally {
        if (requestId === requestIdRef.current) {
          fetchLockRef.current = false;
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [activeTab, debouncedSearch],
  );

  useEffect(() => {
    void fetchPage(1);
  }, [fetchPage]);

  const hasMore = projectsHubHasMore(items.length, total);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || fetchLockRef.current || !hasMore) return;
    void fetchPage(pageRef.current + 1);
  }, [fetchPage, hasMore, loading, loadingMore]);

  const refetch = useCallback(async () => {
    await fetchPage(1);
  }, [fetchPage]);

  return {
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    searchInput,
    setSearchInput,
    items,
    total,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    error,
    refetch,
  };
}
