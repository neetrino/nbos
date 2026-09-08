'use client';

import { FolderKanban, Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  NAVIGABLE_ENTITY_CARD_GRID_PROJECTS_CLASS,
  ProductNavigableCard,
  ProjectNavigableCard,
} from '@/components/shared';
import { ProductsHubListTable } from '@/features/projects/components/ProductsHubListTable';
import { ProjectsListTable } from '@/features/projects/components/ProjectsListTable';
import type { ProductsHubViewMode } from '@/features/projects/constants/products-hub-page-preferences-storage';
import type {
  ProjectsHubTab,
  ProjectsHubViewMode,
} from '@/features/projects/constants/projects-page-preferences-storage';
import type { Product } from '@/lib/api/products';
import type { Project } from '@/lib/api/projects';

export function ProjectsHubDirectoryPanel({
  loading,
  error,
  projects,
  view,
  activeTab,
  emptyTitle,
  emptyDescription,
  showCreate,
  onRetry,
  onCreate,
  onProjectClick,
}: {
  loading: boolean;
  error: string | null;
  projects: Project[];
  view: ProjectsHubViewMode;
  activeTab: ProjectsHubTab;
  emptyTitle: string;
  emptyDescription: string;
  showCreate: boolean;
  onRetry: () => void;
  onCreate: () => void;
  onProjectClick: (project: Project) => void;
}) {
  if (loading) return <LoadingState variant="cards" count={6} />;
  if (error) return <ErrorState description={error} onRetry={onRetry} />;
  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title={emptyTitle}
        description={emptyDescription}
        action={
          showCreate ? (
            <Button type="button" aria-label="Create new project" onClick={onCreate}>
              <Plus size={16} aria-hidden />
              Project
            </Button>
          ) : undefined
        }
      />
    );
  }
  if (view === 'grid') {
    return (
      <div className={NAVIGABLE_ENTITY_CARD_GRID_PROJECTS_CLASS}>
        {projects.map((project) => (
          <ProjectNavigableCard key={project.id} project={project} tabHint={activeTab} />
        ))}
      </div>
    );
  }
  return (
    <ProjectsListTable projects={projects} onProjectClick={onProjectClick} tabHint={activeTab} />
  );
}

export function ProductsHubDirectoryPanel({
  loading,
  error,
  products,
  view,
  emptyTitle,
  emptyDescription,
  onRetry,
  onProductClick,
}: {
  loading: boolean;
  error: string | null;
  products: Product[];
  view: ProductsHubViewMode;
  emptyTitle: string;
  emptyDescription: string;
  onRetry: () => void;
  onProductClick: (product: Product) => void;
}) {
  if (loading) return <LoadingState variant="cards" count={6} />;
  if (error) return <ErrorState description={error} onRetry={onRetry} />;
  if (products.length === 0) {
    return <EmptyState icon={Package} title={emptyTitle} description={emptyDescription} />;
  }
  if (view === 'grid') {
    return (
      <div className={NAVIGABLE_ENTITY_CARD_GRID_PROJECTS_CLASS}>
        {products.map((product) => (
          <ProductNavigableCard
            key={product.id}
            projectId={product.projectId}
            product={product}
            showProjectContext
          />
        ))}
      </div>
    );
  }
  return <ProductsHubListTable products={products} onProductClick={onProductClick} />;
}
