import type { StatusVariant } from '@/components/shared/StatusBadge';
import type { WorkSpace } from '@/lib/api/tasks';

export type WorkSpaceFilterValues = {
  type?: string;
  mode?: string;
};

export type WorkSpaceGroupKey = 'standalone' | 'product';

export interface WorkSpaceSummary {
  total: number;
  standalone: number;
  product: number;
}

export const WORK_SPACE_GROUPS: Array<{
  key: WorkSpaceGroupKey;
  title: string;
  description: string;
}> = [
  {
    key: 'standalone',
    title: 'Standalone Work Spaces',
    description: 'Operational spaces for marketing, finance, internal work, and planning.',
  },
  {
    key: 'product',
    title: 'Product Delivery',
    description: 'Automatically connected work spaces for product and extension execution.',
  },
];

export function getWorkSpaceTypeLabel(type: WorkSpace['type']): string {
  const labels: Record<WorkSpace['type'], string> = {
    PRODUCT_DELIVERY: 'Product Delivery',
    EXTENSION_DELIVERY: 'Legacy Extension Delivery',
    STANDALONE_OPERATIONAL: 'Standalone',
  };
  return labels[type];
}

export function getWorkSpaceTypeVariant(type: WorkSpace['type']): StatusVariant {
  const variants: Record<WorkSpace['type'], StatusVariant> = {
    PRODUCT_DELIVERY: 'purple',
    EXTENSION_DELIVERY: 'blue',
    STANDALONE_OPERATIONAL: 'emerald',
  };
  return variants[type];
}

export function getWorkSpaceGroupKey(workspace: WorkSpace): WorkSpaceGroupKey {
  if (workspace.type === 'PRODUCT_DELIVERY') return 'product';
  return 'standalone';
}

export function getWorkSpaceContextLabel(workspace: WorkSpace): string {
  if (workspace.product) return workspace.product.name;
  if (workspace.extension) return workspace.extension.name;
  if (workspace.project) return workspace.project.name;
  return 'Standalone operational space';
}

export function buildWorkSpaceContextHref(workspace: WorkSpace): string | null {
  if (workspace.productId && workspace.projectId) {
    return `/projects/${workspace.projectId}/products/${workspace.productId}?tab=tasks`;
  }
  if (workspace.projectId) return `/projects/${workspace.projectId}`;
  return null;
}

export function buildDefaultTaskLink(workspace: WorkSpace | null) {
  if (!workspace) return null;
  if (workspace.productId) return { entityType: 'PRODUCT', entityId: workspace.productId };
  if (workspace.extensionId) return { entityType: 'EXTENSION', entityId: workspace.extensionId };
  if (workspace.projectId) return { entityType: 'PROJECT', entityId: workspace.projectId };
  return null;
}

export function formatPlanningStatus(status: string): string {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function summarizeWorkSpaces(workspaces: WorkSpace[]): WorkSpaceSummary {
  return workspaces.reduce<WorkSpaceSummary>(
    (summary, workspace) => {
      if (workspace.type === 'EXTENSION_DELIVERY') return summary;
      summary.total += 1;
      summary[getWorkSpaceGroupKey(workspace)] += 1;
      return summary;
    },
    { total: 0, standalone: 0, product: 0 },
  );
}

export function filterWorkSpaces(
  workspaces: WorkSpace[],
  search: string,
  filters: WorkSpaceFilterValues,
): WorkSpace[] {
  const normalizedSearch = search.trim().toLowerCase();
  return workspaces.filter((workspace) => {
    if (workspace.type === 'EXTENSION_DELIVERY') return false;
    if (filters.type && filters.type !== 'all' && workspace.type !== filters.type) return false;
    if (filters.mode === 'scrum' && !workspace.scrumEnabled) return false;
    if (filters.mode === 'kanban' && workspace.scrumEnabled) return false;
    if (!normalizedSearch) return true;

    const haystack = [
      workspace.name,
      workspace.description,
      workspace.project?.name,
      workspace.product?.name,
      workspace.extension?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });
}

export function groupWorkSpaces(workspaces: WorkSpace[]): Record<WorkSpaceGroupKey, WorkSpace[]> {
  return workspaces.reduce<Record<WorkSpaceGroupKey, WorkSpace[]>>(
    (groups, workspace) => {
      if (workspace.type === 'EXTENSION_DELIVERY') return groups;
      groups[getWorkSpaceGroupKey(workspace)].push(workspace);
      return groups;
    },
    { standalone: [], product: [] },
  );
}
