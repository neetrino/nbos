import { useCallback, useEffect, useRef, useState } from 'react';
import { projectsApi, type Project } from '@/lib/api/projects';
import {
  useProjectsHubPagePreferences,
  type ProjectsHubTab,
  type ProjectsHubViewMode,
} from '@/features/projects/constants/projects-page-preferences-storage';
import {
  PROJECTS_HUB_PAGE_SIZE,
  PROJECTS_HUB_SEARCH_DEBOUNCE_MS,
  PROJECTS_HUB_SORT_BY,
  PROJECTS_HUB_SORT_ORDER,
} from '@/features/projects/constants/projects-hub-page-constants';
import {
  appendUniqueProjects,
  uniqueProjectsById,
} from '@/features/projects/utils/projects-hub-append-items';
import { projectsHubHasMore } from '@/features/projects/utils/projects-hub-has-more';
import { projectsHubTabToListParams } from '@/features/projects/utils/projects-hub-directory-query';

export function useProjectsHubDirectory() {
  const [hubPrefs, setHubPrefs] = useProjectsHubPagePreferences();
  const { activeTab, viewMode } = hubPrefs;
  const setActiveTab = useCallback(
    (tab: ProjectsHubTab) => setHubPrefs({ activeTab: tab }),
    [setHubPrefs],
  );
  const setViewMode = useCallback(
    (view: ProjectsHubViewMode) => setHubPrefs({ viewMode: view }),
    [setHubPrefs],
  );

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<Project[]>([]);
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
        const data = await projectsApi.getAll({
          page: nextPage,
          pageSize: PROJECTS_HUB_PAGE_SIZE,
          search: debouncedSearch || undefined,
          sortBy: PROJECTS_HUB_SORT_BY,
          sortOrder: PROJECTS_HUB_SORT_ORDER,
          ...projectsHubTabToListParams(activeTab),
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
        setError('Projects could not be loaded. Check your connection and try again.');
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

  const handleTabChange = useCallback(
    (tab: ProjectsHubTab) => {
      setActiveTab(tab);
    },
    [setActiveTab],
  );

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
    setActiveTab: handleTabChange,
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
