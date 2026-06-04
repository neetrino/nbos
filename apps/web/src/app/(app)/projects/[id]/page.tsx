'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { projectsApi, type FullProject } from '@/lib/api/projects';
import { CreateProductDialog } from '@/features/projects/components/CreateProductDialog';
import { ProjectHeader } from '@/features/projects/components/ProjectHeader';
import { ProjectInfoPanel } from '@/features/projects/components/ProjectInfoPanel';
import {
  PROJECT_DETAIL_SIDEBAR_CLASS,
  type ProjectProductsViewMode,
} from '@/features/projects/components/project-detail-layout.constants';
import { cn } from '@/lib/utils';
import { ProjectProductsSection } from '@/features/projects/components/ProjectProductsSection';

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<FullProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [productsViewMode, setProductsViewMode] = useState<ProjectProductsViewMode>('card');

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

  if (loading) {
    return <ProjectDetailLoading />;
  }

  if (!project) return null;

  const products = statusFilter
    ? project.products.filter((product) => product.status === statusFilter)
    : project.products;

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <ProjectHeader project={project} onBack={() => router.push('/projects')} />

      <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-6">
          <ProjectProductsSection
            project={project}
            products={products}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            viewMode={productsViewMode}
            onViewModeChange={setProductsViewMode}
            onCreateProduct={() => setShowCreateProduct(true)}
            onOpenProduct={(productId) =>
              router.push(`/projects/${params.id}/products/${productId}`)
            }
          />
        </div>

        <ProjectInfoPanel
          className={PROJECT_DETAIL_SIDEBAR_CLASS}
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
    <div className="flex h-full flex-col gap-5">
      <Skeleton className="h-12 w-72" />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className={cn(PROJECT_DETAIL_SIDEBAR_CLASS, 'h-96')} />
      </div>
    </div>
  );
}
