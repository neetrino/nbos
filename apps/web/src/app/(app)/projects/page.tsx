'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  RefreshCcw,
  FolderKanban,
  LayoutGrid,
  List,
  User,
  Building2,
  Calendar,
  Archive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { PageHeader, FilterBar, EmptyState, StatusBadge } from '@/components/shared';
import { ProjectSheet } from '@/features/projects/components/ProjectSheet';
import {
  PROJECT_TYPES,
  PROJECT_TABS,
  getProjectType,
} from '@/features/projects/constants/projects';
import { projectsApi, type Project } from '@/lib/api/projects';

type ViewMode = 'grid' | 'list';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, setView] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await projectsApi.getAll({
        pageSize: 100,
        search: search || undefined,
        type: filters.type && filters.type !== 'all' ? filters.type : undefined,
      });
      setProjects(data.items);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async (id: string) => {
    await projectsApi.delete(id);
    setSheetOpen(false);
    setSelectedProject(null);
    await fetchProjects();
  };

  const handleClick = (project: Project) => {
    setSelectedProject(project);
    setSheetOpen(true);
  };

  const filteredProjects = projects.filter((p) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'closed') return p.isArchived;
    if (activeTab === 'development') return !p.isArchived;
    if (activeTab === 'maintenance') return !p.isArchived;
    return true;
  });

  const filterConfigs = [
    {
      key: 'type',
      label: 'Type',
      options: PROJECT_TYPES.map((t) => ({ value: t.value, label: t.label })),
    },
  ];

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader title="Projects Hub" description={`${projects.length} projects total`}>
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
          {PROJECT_TABS.map((tab) => (
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
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        onClearFilters={() => setFilters({})}
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
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
          {filteredProjects.map((project) => {
            const projType = getProjectType(project.type);
            return (
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
                      <p className="text-muted-foreground text-[10px] font-medium">
                        {project.code}
                      </p>
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
                  {project.deadline && (
                    <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <Calendar size={11} />
                      <span>{new Date(project.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  {projType && <StatusBadge label={projType.label} variant={projType.variant} />}
                  <div className="text-muted-foreground flex items-center gap-2 text-[10px]">
                    <span>{project._count.products} products</span>
                    <span>&middot;</span>
                    <span>{project._count.orders} orders</span>
                  </div>
                </div>

                <div className="mt-3 flex gap-1.5">
                  {project.seller && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-[8px] font-bold text-amber-700">
                      {project.seller.firstName[0]}
                      {project.seller.lastName[0]}
                    </div>
                  )}
                  {project.pm && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[8px] font-bold text-blue-700">
                      {project.pm.firstName[0]}
                      {project.pm.lastName[0]}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>PM</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead className="text-center">Products</TableHead>
                <TableHead>Deadline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => {
                const projType = getProjectType(project.type);
                return (
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
                    <TableCell>
                      {projType && (
                        <StatusBadge label={projType.label} variant={projType.variant} />
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {project.contact?.firstName} {project.contact?.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {project.company?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {project.pm ? `${project.pm.firstName} ${project.pm.lastName}` : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {project.seller
                        ? `${project.seller.firstName} ${project.seller.lastName}`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {project._count.products}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {project.deadline ? new Date(project.deadline).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ProjectSheet
        project={selectedProject}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onDelete={handleDelete}
      />
    </div>
  );
}
