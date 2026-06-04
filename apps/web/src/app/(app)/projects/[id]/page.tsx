'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { projectsApi, type FullProject } from '@/lib/api/projects';
import { CreateProductDialog } from '@/features/projects/components/CreateProductDialog';
import { ProjectInfoPanel } from '@/features/projects/components/ProjectInfoPanel';
import { useProjectDetailHeader } from '@/features/projects/hooks/use-project-detail-header';
import { PROJECT_DETAIL_SIDEBAR_CLASS } from '@/features/projects/components/project-detail-layout.constants';
import { useProjectDetailViewMode } from '@/features/projects/constants/project-detail-view-storage';
import { cn } from '@/lib/utils';
import { ProjectExtensionsSection } from '@/features/projects/components/ProjectExtensionsSection';
import { ProjectProductsSection } from '@/features/projects/components/ProjectProductsSection';

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<FullProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [detailViewMode, setDetailViewMode] = useProjectDetailViewMode();

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
    fetchProject();
  }, [fetchProject]);

  useProjectDetailHeader(project);

  if (loading) {
    return <ProjectDetailLoading />;
  }

  if (!project) return null;

  const products = statusFilter
    ? project.products.filter((product) => product.status === statusFilter)
    : project.products;

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
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
            onOpenExtension={(extension) =>
              router.push(`/projects/${params.id}/products/${extension.productId}?tab=extensions`)
            }
          />
        </div>

        <ProjectInfoPanel
          className={cn(PROJECT_DETAIL_SIDEBAR_CLASS, 'lg:self-start')}
          project={project}
          onProjectUpdated={setProject}
        />
      </div>

      <CreateProductDialog
        open={showCreateProduct}
        onOpenChange={setShowCreateProduct}
        onCreated={fetchProject}
        projectId={project.id}
      />
    </div>
  );
}

function ProjectDetailLoading() {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className={cn(PROJECT_DETAIL_SIDEBAR_CLASS, 'h-96 lg:self-start')} />
      </div>
    </div>
  );
}
