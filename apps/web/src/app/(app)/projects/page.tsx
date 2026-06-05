'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderKanban, LayoutGrid, List, Plus, User, Building2, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  PageHero,
  PageHeroTabs,
  ViewModeSwitch,
  IntegratedSearchFilters,
  EmptyState,
  ErrorState,
  LoadingState,
  NavigableEntityCard,
  NAVIGABLE_ENTITY_CARD_GRID_PROJECTS_CLASS,
  type ViewModeOption,
} from '@/components/shared';
import { PROJECT_HUB_TABS } from '@/features/projects/constants/projects';
import type { ProjectsHubViewMode } from '@/features/projects/constants/projects-page-preferences-storage';
import { CreateProjectHubDialog } from '@/features/projects/components/CreateProjectHubDialog';
import { ProjectsPageSettingsSheet } from '@/features/projects/components/ProjectsPageSettingsSheet';
import { useProjectsHubDirectory } from '@/features/projects/hooks/use-projects-hub-directory';
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
  const directory = useProjectsHubDirectory();
  const {
    activeTab,
    setActiveTab,
    viewMode: view,
    setViewMode: setView,
    searchInput,
    setSearchInput,
    setPage,
    items: projects,
    meta,
    loading,
    error,
    refetch,
  } = directory;

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
        search={
          <IntegratedSearchFilters
            search={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="Search by project name, code, company, contact…"
            onClearAll={() => setSearchInput('')}
          />
        }
        viewMode={<ViewModeSwitch value={view} onChange={setView} options={PROJECT_VIEW_OPTIONS} />}
        trailing={
          <>
            <ProjectsPageSettingsSheet items={projects} />
            <Button
              type="button"
              className="shrink-0 gap-2"
              aria-label="Create new project"
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={16} aria-hidden />
              Project
            </Button>
          </>
        }
      />

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
      ) : view === 'grid' ? (
        <div className={NAVIGABLE_ENTITY_CARD_GRID_PROJECTS_CLASS}>
          {projects.map((project) => (
            <NavigableEntityCard
              key={project.id}
              href={`/projects/${project.id}`}
              icon={FolderKanban}
              eyebrow={project.code}
              title={project.name}
              description={project.description}
              headerTrailing={
                project.isArchived ? (
                  <Archive size={14} className="text-muted-foreground shrink-0" />
                ) : undefined
              }
              metaLines={[
                ...(project.company ? [{ icon: Building2, text: project.company.name }] : []),
                {
                  icon: User,
                  text: `${project.contact?.firstName ?? ''} ${project.contact?.lastName ?? ''}`.trim(),
                },
              ]}
              footer={<span>{project._count.orders} orders</span>}
            />
          ))}
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-center">Orders</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow
                  key={project.id}
                  className="cursor-pointer"
                  onClick={() => handleClick(project)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="bg-accent/10 text-accent rounded-lg p-1.5">
                        <FolderKanban size={14} />
                      </div>
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-muted-foreground text-xs">{project.code}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {project.contact?.firstName} {project.contact?.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {project.company?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-center font-medium">{project._count.orders}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!loading && !error && projects.length > 0 ? (
        <ProjectsHubPaginationFooter meta={meta} onPageChange={setPage} />
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

function ProjectsHubPaginationFooter({
  meta,
  onPageChange,
}: {
  meta: { total: number; page: number; pageSize: number; totalPages: number };
  onPageChange: (page: number) => void;
}) {
  const start = meta.total === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1;
  const end = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <div className="text-muted-foreground flex flex-col gap-3 border-t pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="tabular-nums">
        {start}–{end} of {meta.total}
      </span>
      {meta.totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={meta.page <= 1}
            onClick={() => onPageChange(meta.page - 1)}
          >
            Previous
          </Button>
          <span className="text-muted-foreground px-1 tabular-nums">
            Page {meta.page} of {meta.totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={meta.page >= meta.totalPages}
            onClick={() => onPageChange(meta.page + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
