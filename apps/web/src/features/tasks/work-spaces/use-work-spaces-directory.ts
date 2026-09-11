import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { tasksApi, type WorkSpace, type WorkSpaceListPayload } from '@/lib/api/tasks';
import {
  WORK_SPACES_PAGE_SIZE,
  WORK_SPACES_SEARCH_DEBOUNCE_MS,
} from './work-spaces-page-constants';
import { SEARCH_FILTER_PAGE_ID, usePersistedSearchFilterField } from '@/lib/persisted-client-state';
import {
  parseWorkSpaceDirectoryTab,
  WORK_SPACES_DIRECTORY_TAB_QUERY,
  workSpacesDirectorySearch,
  type WorkSpaceDirectoryTab,
} from './work-spaces-directory-tab';

export type { WorkSpaceDirectoryTab };

type WorkSpaceModeFilter = 'all' | 'scrum' | 'kanban';

function parseWorkSpaceModeFilter(raw: string): WorkSpaceModeFilter {
  if (raw === 'scrum' || raw === 'kanban') return raw;
  return 'all';
}

const TYPE_BY_TAB: Record<WorkSpaceDirectoryTab, WorkSpace['type']> = {
  standalone: 'STANDALONE_OPERATIONAL',
  product: 'PRODUCT_DELIVERY',
};

const emptyMeta = () => ({
  total: 0,
  page: 1,
  pageSize: WORK_SPACES_PAGE_SIZE,
  totalPages: 0,
});

export function useWorkSpacesDirectory() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = parseWorkSpaceDirectoryTab(searchParams.get(WORK_SPACES_DIRECTORY_TAB_QUERY));
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modeRaw, setModeRaw] = usePersistedSearchFilterField(
    SEARCH_FILTER_PAGE_ID.tasksWorkSpaces,
    'mode',
    'all',
  );
  const mode = parseWorkSpaceModeFilter(modeRaw);
  const setMode = (next: WorkSpaceModeFilter) => setModeRaw(next);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [payload, setPayload] = useState<WorkSpaceListPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(
      () => setDebouncedSearch(searchInput.trim()),
      WORK_SPACES_SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, mode, tab]);

  const handleTabChange = useCallback(
    (next: WorkSpaceDirectoryTab) => {
      if (next === tab) return;
      const qs = workSpacesDirectorySearch(next, searchParams.toString());
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams, tab],
  );

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tasksApi.getWorkSpaces({
        type: TYPE_BY_TAB[tab],
        page,
        pageSize: WORK_SPACES_PAGE_SIZE,
        search: debouncedSearch || undefined,
        ...(mode !== 'all' ? { mode } : {}),
      });
      setPayload(data);
      setError(null);
    } catch {
      setError('Work Spaces could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [tab, page, debouncedSearch, mode]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  return {
    tab,
    setTab: handleTabChange,
    searchInput,
    setSearchInput,
    mode,
    setMode,
    page,
    setPage,
    view,
    setView,
    items: payload?.items ?? [],
    meta: payload?.meta ?? emptyMeta(),
    counts: payload?.counts ?? { standalone: 0, product: 0, total: 0 },
    loading,
    error,
    refetch: fetchList,
  };
}
