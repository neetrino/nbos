'use client';

import { useState, useEffect, useCallback } from 'react';
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
  type ViewModeOption,
} from '@/components/shared';
import { PROJECT_HUB_TABS } from '@/features/projects/constants/projects';
import { CreateProjectHubDialog } from '@/features/projects/components/CreateProjectHubDialog';
import { ProjectsPageSettingsSheet } from '@/features/projects/components/ProjectsPageSettingsSheet';
import { projectsApi, type Project } from '@/lib/api/projects';

type ViewMode = 'grid' | 'list';

const PROJECT_VIEW_OPTIONS: ViewModeOption<ViewMode>[] = [
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await projectsApi.getAll({
        pageSize: 100,
        search: search || undefined,
        ...(activeTab === 'active' ? { isArchived: false } : {}),
        ...(activeTab === 'archived' ? { isArchived: true } : {}),
      });
      setProjects(data.items);
      setError(null);
    } catch {
      setError('Projects could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [search, activeTab]);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  const handleClick = (project: Project) => {
    router.push(`/projects/${project.id}`);
  };

  return (
    <div className="flex h-full flex-col gap-5">
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
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by project name, code, company, contact…"
            onClearAll={() => setSearch('')}
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
        <ErrorState description={error} onRetry={fetchProjects} />
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group border-border bg-card cursor-pointer rounded-2xl border p-5 transition-all hover:shadow-md"
              onClick={() => handleClick(project)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-accent/10 text-accent rounded-xl p-2.5">
                    <FolderKanban size={18} />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] font-medium">{project.code}</p>
                    <h3 className="text-foreground text-sm font-semibold">{project.name}</h3>
                  </div>
                </div>
                {project.isArchived && <Archive size={14} className="text-muted-foreground" />}
              </div>

              {project.description && (
                <p className="text-muted-foreground mt-3 line-clamp-2 text-xs">
                  {project.description}
                </p>
              )}

              <div className="mt-4 space-y-2">
                {project.company && (
                  <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <Building2 size={11} />
                    <span>{project.company.name}</span>
                  </div>
                )}
                <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <User size={11} />
                  <span>
                    {project.contact?.firstName} {project.contact?.lastName}
                  </span>
                </div>
              </div>

              <div className="text-muted-foreground mt-4 flex items-center justify-end text-[10px]">
                <span>{project._count.orders} orders</span>
              </div>
            </div>
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

      <CreateProjectHubDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(project) => {
          void fetchProjects();
          router.push(`/projects/${project.id}`);
        }}
      />
    </div>
  );
}
