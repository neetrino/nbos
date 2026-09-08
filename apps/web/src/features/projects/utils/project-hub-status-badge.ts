import type { StatusVariant } from '@/components/shared/StatusBadge';
import type { ProjectsHubTab } from '@/features/projects/constants/projects-page-preferences-storage';
import type { Project, ProjectHubStatus } from '@/lib/api/projects';

export const PROJECT_HUB_STATUS_LABEL: Record<ProjectHubStatus, string> = {
  incoming: 'Incoming',
  active: 'Active',
  closed: 'Closed',
  trash: 'Trash',
};

export const PROJECT_HUB_STATUS_VARIANT: Record<ProjectHubStatus, StatusVariant> = {
  incoming: 'blue',
  active: 'emerald',
  closed: 'gray',
  trash: 'red',
};

export function resolveProjectHubStatus(
  project: Project,
  tabHint?: ProjectsHubTab,
): ProjectHubStatus {
  if (project.trashedAt != null) return 'trash';
  if (project.hubView) return project.hubView;
  if (
    tabHint === 'incoming' ||
    tabHint === 'active' ||
    tabHint === 'closed' ||
    tabHint === 'trash'
  ) {
    return tabHint;
  }
  const productCount = project._count.products ?? 0;
  const extensionCount = project._count.extensions ?? 0;
  if (productCount === 0 && extensionCount === 0) return 'incoming';
  return 'active';
}
