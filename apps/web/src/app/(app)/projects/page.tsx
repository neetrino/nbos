'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  RefreshCcw,
  FolderKanban,
  LayoutGrid,
  List,
  User,
  Building2,
  Archive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { PageHeader, FilterBar, EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { PROJECT_HUB_TABS } from '@/features/projects/constants/projects';
import { projectsApi, type Project } from '@/lib/api/projects';

type ViewMode = 'grid' | 'list';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState('all');

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
    fetchProjects();
  }, [fetchProjects]);

  const handleClick = (project: Project) => {
    router.push(`/projects/${project.id}`);
  };

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader title="Project Hub" description={`${projects.length} projects`}>
        <Button variant="outline" size="icon" onClick={fetchProjects}>
          <RefreshCcw size={16} />
        </Button>
        <div className="border-border flex rounded-lg border">
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setView('grid')}
            className="rounded-r-none"
          >
            <LayoutGrid size={14} />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setView('list')}
            className="rounded-l-none"
          >
            <List size={14} />
          </Button>
        </div>
        <Button>
          <Plus size={16} />
          New Project
        </Button>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {PROJECT_HUB_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search projects by name..."
        filters={[]}
        filterValues={{}}
        onFilterChange={() => {}}
        onClearFilters={() => {}}
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
            <Button>
              <Plus size={16} />
              Create First Project
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
    </div>
  );
}
