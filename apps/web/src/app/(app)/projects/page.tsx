'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  FolderKanban,
  Calendar,
  User,
  Building2,
  MoreHorizontal,
  Archive,
  RefreshCcw,
  LayoutGrid,
  List,
} from 'lucide-react';
import { projectsApi, type Project } from '@/lib/api/projects';

const PROJECT_TYPES: Record<string, string> = {
  WHITE_LABEL: 'White Label',
  MIX: 'Mix',
  CUSTOM_CODE: 'Custom Code',
};

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="group border-border bg-card rounded-2xl border p-5 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-accent/10 text-accent rounded-xl p-2.5">
            <FolderKanban size={18} />
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium">{project.code}</p>
            <h3 className="text-foreground text-sm font-semibold">{project.name}</h3>
          </div>
        </div>
        <button className="hover:bg-secondary rounded-lg p-1 opacity-0 transition-opacity group-hover:opacity-100">
          <MoreHorizontal size={14} className="text-muted-foreground" />
        </button>
      </div>

      {project.description && (
        <p className="text-muted-foreground mt-3 line-clamp-2 text-xs">{project.description}</p>
      )}

      <div className="mt-4 space-y-2">
        {project.company && (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Building2 size={12} />
            <span>{project.company.name}</span>
          </div>
        )}
        {project.pm && (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <User size={12} />
            <span>
              PM: {project.pm.firstName} {project.pm.lastName}
            </span>
          </div>
        )}
        {project.deadline && (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Calendar size={12} />
            <span>{new Date(project.deadline).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="bg-secondary text-muted-foreground rounded-md px-2 py-0.5 text-[10px] font-medium">
          {PROJECT_TYPES[project.type] ?? project.type}
        </span>
        <div className="text-muted-foreground flex items-center gap-2 text-[10px]">
          <span>{project._count.products} products</span>
          <span>&middot;</span>
          <span>{project._count.orders} orders</span>
        </div>
      </div>

      {project.isArchived && (
        <div className="text-muted-foreground mt-2 flex items-center gap-1 text-[10px]">
          <Archive size={10} />
          <span>Archived</span>
        </div>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await projectsApi.getAll({
        pageSize: 50,
        search: search || undefined,
      });
      setProjects(data.items);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Projects</h1>
          <p className="text-muted-foreground mt-1 text-sm">{projects.length} projects total</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchProjects}
            className="border-border text-muted-foreground hover:bg-secondary rounded-xl border p-2.5 transition-colors"
          >
            <RefreshCcw size={16} />
          </button>
          <div className="border-border flex rounded-xl border">
            <button
              onClick={() => setView('grid')}
              className={`rounded-l-xl p-2.5 ${view === 'grid' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`rounded-r-xl p-2.5 ${view === 'list' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}
            >
              <List size={16} />
            </button>
          </div>
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors">
            <Plus size={16} />
            New Project
          </button>
        </div>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border py-2.5 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="border-accent h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      ) : projects.length === 0 ? (
        <div className="border-border rounded-2xl border border-dashed py-20 text-center">
          <FolderKanban size={48} className="text-muted-foreground/30 mx-auto" />
          <h3 className="text-foreground mt-4 text-lg font-semibold">No projects yet</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Create your first project to get started
          </p>
        </div>
      ) : (
        <div
          className={
            view === 'grid' ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3'
          }
        >
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
