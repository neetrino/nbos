'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PageHeroTabs,
  ViewModeSwitch,
  IntegratedSearchFilters,
  DetailSheetTabPanel,
  useModuleHeroSlots,
} from '@/components/shared';
import { InfiniteScrollSentinel } from '@/components/shared/InfiniteScrollSentinel';
import { PROJECT_HUB_TABS } from '@/features/projects/constants/projects';
import { PROJECTS_HUB_SEARCH_PLACEHOLDER } from '@/features/projects/constants/projects-hub-page-constants';
import { PROJECT_HUB_DIRECTORY_VIEW_OPTIONS } from '@/features/projects/constants/projects-hub-view-options';
import type { ProjectsHubViewMode } from '@/features/projects/constants/projects-page-preferences-storage';
import { CreateProjectHubDialog } from '@/features/projects/components/CreateProjectHubDialog';
import { ProjectsHubDirectoryPanel } from '@/features/projects/components/projects-hub-directory-panels';
import { ProjectsPageSettingsSheet } from '@/features/projects/components/ProjectsPageSettingsSheet';
import { useProjectsHubDirectory } from '@/features/projects/hooks/use-projects-hub-directory';
import { projectsHubEmptyCopy } from '@/features/projects/utils/projects-hub-empty-copy';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import type { Project } from '@/lib/api/projects';

export function ProjectsHubProjectsPageContent() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const isMobileViewport = useIsMobileViewport();
  const directory = useProjectsHubDirectory();
  const onCreate = useCallback(() => setCreateOpen(true), []);
  const effectiveView: ProjectsHubViewMode = isMobileViewport ? 'grid' : directory.viewMode;
  const emptyCopy = projectsHubEmptyCopy(directory.activeTab);

  useModuleHeroSlots(
    useProjectsHubHeroSlots({
      activeTab: directory.activeTab,
      setActiveTab: directory.setActiveTab,
      searchInput: directory.searchInput,
      setSearchInput: directory.setSearchInput,
      viewMode: directory.viewMode,
      setViewMode: directory.setViewMode,
      items: directory.items,
      isMobileViewport,
      onCreate,
    }),
  );

  return (
    <>
      <DetailSheetTabPanel tabKey={directory.activeTab}>
        <ProjectsHubDirectoryPanel
          loading={directory.loading}
          error={directory.error}
          projects={directory.items}
          view={effectiveView}
          activeTab={directory.activeTab}
          emptyTitle={emptyCopy.title}
          emptyDescription={emptyCopy.description}
          showCreate={emptyCopy.showCreate}
          onRetry={() => void directory.refetch()}
          onCreate={onCreate}
          onProjectClick={(project: Project) => router.push(`/projects/${project.id}`)}
        />
      </DetailSheetTabPanel>
      <ProjectsHubInfiniteScroll
        loading={directory.loading}
        loadingMore={directory.loadingMore}
        hasItems={directory.items.length > 0}
        error={directory.error}
        hasMore={directory.hasMore}
        onReach={directory.loadMore}
      />
      <CreateProjectHubDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(project) => {
          void directory.refetch();
          router.push(`/projects/${project.id}`);
        }}
      />
    </>
  );
}

function useProjectsHubHeroSlots({
  activeTab,
  setActiveTab,
  searchInput,
  setSearchInput,
  viewMode,
  setViewMode,
  items,
  isMobileViewport,
  onCreate,
}: {
  activeTab: ReturnType<typeof useProjectsHubDirectory>['activeTab'];
  setActiveTab: ReturnType<typeof useProjectsHubDirectory>['setActiveTab'];
  searchInput: string;
  setSearchInput: (value: string) => void;
  viewMode: ProjectsHubViewMode;
  setViewMode: ReturnType<typeof useProjectsHubDirectory>['setViewMode'];
  items: ReturnType<typeof useProjectsHubDirectory>['items'];
  isMobileViewport: boolean;
  onCreate: () => void;
}) {
  return useMemo(
    () => ({
      tabs: (
        <PageHeroTabs
          value={activeTab}
          onChange={setActiveTab}
          options={[...PROJECT_HUB_TABS]}
          ariaLabel="Project Hub filters"
          showOnMobile
          fullWidthOnMobile
          registerMobileDock={false}
        />
      ),
      search: (
        <IntegratedSearchFilters
          search={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder={PROJECTS_HUB_SEARCH_PLACEHOLDER}
          onClearAll={() => setSearchInput('')}
        />
      ),
      viewMode: isMobileViewport ? null : (
        <ViewModeSwitch
          value={viewMode}
          onChange={setViewMode}
          options={PROJECT_HUB_DIRECTORY_VIEW_OPTIONS}
        />
      ),
      trailing: (
        <>
          <ProjectsPageSettingsSheet items={items} />
          <Button
            type="button"
            size={isMobileViewport ? 'icon-sm' : 'default'}
            className="shrink-0 gap-2"
            aria-label="Create new project"
            onClick={onCreate}
          >
            <Plus size={16} aria-hidden />
            {isMobileViewport ? null : 'Project'}
          </Button>
        </>
      ),
    }),
    [
      activeTab,
      isMobileViewport,
      items,
      onCreate,
      searchInput,
      setActiveTab,
      setSearchInput,
      setViewMode,
      viewMode,
    ],
  );
}

function ProjectsHubInfiniteScroll({
  loading,
  loadingMore,
  hasItems,
  error,
  hasMore,
  onReach,
}: {
  loading: boolean;
  loadingMore: boolean;
  hasItems: boolean;
  error: string | null;
  hasMore: boolean;
  onReach: () => void;
}) {
  if (loading || error || !hasItems) return null;
  return (
    <>
      {loadingMore ? (
        <p className="text-muted-foreground py-3 text-center text-xs">Loading more…</p>
      ) : null}
      <InfiniteScrollSentinel onReach={onReach} disabled={loading || loadingMore || !hasMore} />
    </>
  );
}
