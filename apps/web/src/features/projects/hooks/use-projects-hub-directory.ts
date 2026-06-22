import { useCallback, useEffect, useState } from 'react';
import { projectsApi, type Project } from '@/lib/api/projects';
import {
  useProjectsHubPagePreferences,
  type ProjectsHubTab,
  type ProjectsHubViewMode,
} from '@/features/projects/constants/projects-page-preferences-storage';
import {
  PROJECTS_HUB_PAGE_SIZE,
  PROJECTS_HUB_SEARCH_DEBOUNCE_MS,
} from '@/features/projects/constants/projects-hub-page-constants';

const emptyMeta = () => ({
  total: 0,
  page: 1,
  pageSize: PROJECTS_HUB_PAGE_SIZE,
  totalPages: 0,
});

function tabToScope(tab: ProjectsHubTab): 'active' | 'trash' | undefined {
  if (tab === 'active') return 'active';
  if (tab === 'trash') return 'trash';
  return undefined;
}

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
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Project[]>([]);
  const [meta, setMeta] = useState(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(
      () => setDebouncedSearch(searchInput.trim()),
      PROJECTS_HUB_SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activeTab]);

  const handleTabChange = useCallback(
    (tab: ProjectsHubTab) => {
      setActiveTab(tab);
      setPage(1);
    },
    [setActiveTab],
  );

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const scope = tabToScope(activeTab);
      const data = await projectsApi.getAll({
        page,
        pageSize: PROJECTS_HUB_PAGE_SIZE,
        search: debouncedSearch || undefined,
        ...(scope ? { scope } : {}),
      });
      setItems(data.items);
      setMeta(data.meta);
      setError(null);
    } catch {
      setError('Projects could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, activeTab]);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  return {
    activeTab,
    setActiveTab: handleTabChange,
    viewMode,
    setViewMode,
    searchInput,
    setSearchInput,
    page,
    setPage,
    items,
    meta,
    loading,
    error,
    refetch: fetchProjects,
  };
}
