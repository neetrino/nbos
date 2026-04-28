'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import {
  projectsApi,
  type FullProject,
  type UpdateKickoffChecklistItemInput,
} from '@/lib/api/projects';
import { CreateProductDialog } from '@/features/projects/components/CreateProductDialog';
import { ProjectExtensionsSnapshot } from '@/features/projects/components/ProjectExtensionsSnapshot';
import { ProjectHeader } from '@/features/projects/components/ProjectHeader';
import { ProjectInfoCard } from '@/features/projects/components/ProjectInfoCard';
import { ProjectIntakePanel } from '@/features/projects/components/ProjectIntakePanel';
import { ProjectProductsSection } from '@/features/projects/components/ProjectProductsSection';

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<FullProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

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

  const handleKickoffChecklistItemUpdate = useCallback(
    async (itemId: string, data: UpdateKickoffChecklistItemInput) => {
      const updated = await projectsApi.updateKickoffChecklistItem(params.id, itemId, data);
      setProject((current) => updateProjectChecklist(current, updated));
      return updated;
    },
    [params.id],
  );

  if (loading) {
    return <ProjectDetailLoading />;
  }

  if (!project) return null;

  const products = statusFilter
    ? project.products.filter((product) => product.status === statusFilter)
    : project.products;

  return (
    <div className="flex h-full flex-col gap-6">
      <ProjectHeader
        project={project}
        onBack={() => router.push('/projects')}
        onRefresh={() => {
          fetchProject();
        }}
      />

      <ProjectInfoCard project={project} />
      <ProjectIntakePanel
        project={project}
        onKickoffChecklistItemUpdate={handleKickoffChecklistItemUpdate}
      />
      <ProjectExtensionsSnapshot project={project} />

      <ProjectProductsSection
        project={project}
        products={products}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onCreateProduct={() => setShowCreateProduct(true)}
        onOpenProduct={(productId) => router.push(`/projects/${params.id}/products/${productId}`)}
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

function updateProjectChecklist(
  project: FullProject | null,
  updated: NonNullable<FullProject['kickoffChecklist']>[number],
) {
  if (!project) return project;
  const checklist = project.kickoffChecklist ?? [];
  const nextChecklist = checklist
    .map((item) => (item.id === updated.id ? updated : item))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return { ...project, kickoffChecklist: nextChecklist };
}

function ProjectDetailLoading() {
  return (
    <div className="flex h-full flex-col gap-5">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="h-40 w-full" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
    </div>
  );
}
