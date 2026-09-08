import type { ProjectsHubTab } from '@/features/projects/constants/projects-page-preferences-storage';
import type { ProjectListParams } from '@/lib/api/projects';

export function projectsHubTabToListParams(
  tab: ProjectsHubTab,
): Pick<ProjectListParams, 'scope' | 'hubView'> {
  if (tab === 'trash') return { scope: 'trash' };
  if (tab === 'incoming' || tab === 'active' || tab === 'closed') {
    return { hubView: tab };
  }
  return {};
}
