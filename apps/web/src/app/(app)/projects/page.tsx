'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderKanban, LayoutGrid, List, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PageHero,
  PageHeroTabs,
  ViewModeSwitch,
  IntegratedSearchFilters,
  EmptyState,
  ErrorState,
  LoadingState,
  DetailSheetTabPanel,
  NAVIGABLE_ENTITY_CARD_GRID_PROJECTS_CLASS,
  ProjectNavigableCard,
  type ViewModeOption,
} from '@/components/shared';
import { InfiniteScrollSentinel } from '@/components/shared/InfiniteScrollSentinel';
import { PROJECT_HUB_TABS } from '@/features/projects/constants/projects';
import type { ProjectsHubViewMode } from '@/features/projects/constants/projects-page-preferences-storage';
import { CreateProjectHubDialog } from '@/features/projects/components/CreateProjectHubDialog';
import { ProjectsListTable } from '@/features/projects/components/ProjectsListTable';
import { ProjectsPageSettingsSheet } from '@/features/projects/components/ProjectsPageSettingsSheet';
import { useProjectsHubDirectory } from '@/features/projects/hooks/use-projects-hub-directory';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import type { Project } from '@/lib/api/projects';

const PROJECT_VIEW_OPTIONS: ViewModeOption<ProjectsHubViewMode>[] = [
  {
    value: 'grid',
    label: 'Grid',
    icon: <LayoutGrid className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Card grid view',
  },
  {
    value: 'list',
    label: 'List',
    icon: <List className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'List view',
  },
];

export default function ProjectsPage() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const isMobileViewport = useIsMobileViewport();
  const directory = useProjectsHubDirectory();
  const {
    activeTab,
    setActiveTab,
    viewMode: view,
    setViewMode: setView,
    searchInput,
    setSearchInput,
    items: projects,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    error,
    refetch,
  } = directory;

  const effectiveView: ProjectsHubViewMode = isMobileViewport ? 'grid' : view;

  const handleClick = (project: Project) => {
    router.push(`/projects/${project.id}`);
  };

  return (
    <div className="flex min-h-0 flex-col gap-5">
      <PageHero
        title="Project Hub"
        tabs={
          <PageHeroTabs
            value={activeTab}
            onChange={setActiveTab}
            options={[...PROJECT_HUB_TABS]}
            ariaLabel="Project Hub filters"
          />
        }
        tabsEnd={
          isMobileViewport ? (
            <Button
              type="button"
              size="icon-sm"
              className="shrink-0"
              aria-label="Create new project"
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={16} aria-hidden />
            </Button>
          ) : null
        }
        search={
          <IntegratedSearchFilters
            search={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="Search by project name, code, company, contact…"
            onClearAll={() => setSearchInput('')}
          />
        }
        viewMode={
          isMobileViewport ? null : (
            <ViewModeSwitch value={view} onChange={setView} options={PROJECT_VIEW_OPTIONS} />
          )
        }
        trailing={
          <>
            <ProjectsPageSettingsSheet items={projects} />
            {isMobileViewport ? null : (
              <Button
                type="button"
                className="shrink-0 gap-2"
                aria-label="Create new project"
                onClick={() => setCreateOpen(true)}
              >
                <Plus size={16} aria-hidden />
                Project
              </Button>
            )}
          </>
        }
      />

      <DetailSheetTabPanel tabKey={activeTab}>
        {loading ? (
          <LoadingState variant="cards" count={6} />
        ) : error ? (
          <ErrorState description={error} onRetry={() => void refetch()} />
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects found"
            description="Create your first project to get started"
            action={
              <Button
                type="button"
                aria-label="Create new project"
                onClick={() => setCreateOpen(true)}
              >
                <Plus size={16} aria-hidden />
                Project
              </Button>
            }
          />
        ) : effectiveView === 'grid' ? (
          <div className={NAVIGABLE_ENTITY_CARD_GRID_PROJECTS_CLASS}>
            {projects.map((project) => (
              <ProjectNavigableCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <ProjectsListTable projects={projects} onProjectClick={handleClick} />
        )}
      </DetailSheetTabPanel>

      {!loading && !error && projects.length > 0 ? (
        <>
          {loadingMore ? (
            <p className="text-muted-foreground py-3 text-center text-xs">Loading more…</p>
          ) : null}
          <InfiniteScrollSentinel
            onReach={loadMore}
            disabled={loading || loadingMore || !hasMore}
          />
        </>
      ) : null}

      <CreateProjectHubDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(project) => {
          void refetch();
          router.push(`/projects/${project.id}`);
        }}
      />
    </div>
  );
}
