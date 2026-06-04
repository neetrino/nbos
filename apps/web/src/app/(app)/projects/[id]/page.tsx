'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { projectsApi, type FullProject } from '@/lib/api/projects';
import { prefetchProjectTeam } from '@/features/platform-access/project-team-request';
import { CreateProductDialog } from '@/features/projects/components/CreateProductDialog';
import { EntityDetailSheetsHost } from '@/features/projects/components/EntityDetailSheetsHost';
import { ProjectInfoPanel } from '@/features/projects/components/ProjectInfoPanel';
import { useProjectDetailHeader } from '@/features/projects/hooks/use-project-detail-header';
import {
  PROJECT_DETAIL_MAIN_COLUMN_CLASS,
  PROJECT_DETAIL_PAGE_ROW_CLASS,
  PROJECT_DETAIL_SIDEBAR_CLASS,
  PROJECT_DETAIL_SIDEBAR_EDGE_CLASS,
} from '@/features/projects/components/project-detail-layout.constants';
import { useProjectDetailViewMode } from '@/features/projects/constants/project-detail-view-storage';
import { cn } from '@/lib/utils';
import { ProjectExtensionsSection } from '@/features/projects/components/ProjectExtensionsSection';
import { ProjectProductsSection } from '@/features/projects/components/ProjectProductsSection';

function ProjectDetailPageContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<FullProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [detailViewMode, setDetailViewMode] = useProjectDetailViewMode();
  const [teamRefreshKey, setTeamRefreshKey] = useState(0);

  const fetchProject = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    try {
      const data = await projectsApi.getById(params.id);
      setProject(data);
    } catch {
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    if (!params.id) return;
    prefetchProjectTeam(params.id);
    fetchProject();
  }, [fetchProject, params.id]);

  useProjectDetailHeader(project);

  if (loading) {
    return <ProjectDetailLoading />;
  }

  if (!project) return null;

  const products = statusFilter
    ? project.products.filter((product) => product.status === statusFilter)
    : project.products;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={PROJECT_DETAIL_PAGE_ROW_CLASS}>
        <div className={PROJECT_DETAIL_MAIN_COLUMN_CLASS}>
          <ProjectProductsSection
            project={project}
            products={products}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            viewMode={detailViewMode}
            onViewModeChange={setDetailViewMode}
            onCreateProduct={() => setShowCreateProduct(true)}
            onOpenProduct={(productId) =>
              router.push(`/projects/${params.id}/products/${productId}`)
            }
          />
          <ProjectExtensionsSection
            extensions={project.extensions}
            viewMode={detailViewMode}
            onOpenProduct={(productId) =>
              router.push(`/projects/${params.id}/products/${productId}`)
            }
          />
        </div>

        <ProjectInfoPanel
          className={cn(PROJECT_DETAIL_SIDEBAR_CLASS, PROJECT_DETAIL_SIDEBAR_EDGE_CLASS)}
          project={project}
          teamRefreshKey={teamRefreshKey}
          onProjectUpdated={setProject}
        />
      </div>

      <EntityDetailSheetsHost
        project={project}
        onEntityUpdated={() => {
          setTeamRefreshKey((key) => key + 1);
          void fetchProject();
        }}
      />

      <CreateProductDialog
        open={showCreateProduct}
        onOpenChange={setShowCreateProduct}
        onCreated={fetchProject}
        projectId={project.id}
      />
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense fallback={<ProjectDetailLoading />}>
      <ProjectDetailPageContent />
    </Suspense>
  );
}

function ProjectDetailLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className={PROJECT_DETAIL_PAGE_ROW_CLASS}>
        <div className={PROJECT_DETAIL_MAIN_COLUMN_CLASS}>
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton
          className={cn(PROJECT_DETAIL_SIDEBAR_CLASS, PROJECT_DETAIL_SIDEBAR_EDGE_CLASS, 'h-96')}
        />
      </div>
    </div>
  );
}
