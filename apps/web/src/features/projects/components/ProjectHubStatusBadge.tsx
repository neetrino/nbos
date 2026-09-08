import { StatusBadge } from '@/components/shared/StatusBadge';
import type { ProjectsHubTab } from '@/features/projects/constants/projects-page-preferences-storage';
import type { Project } from '@/lib/api/projects';
import {
  PROJECT_HUB_STATUS_LABEL,
  PROJECT_HUB_STATUS_VARIANT,
  resolveProjectHubStatus,
} from '@/features/projects/utils/project-hub-status-badge';

const PROJECT_HUB_STATUS_BADGE_CLASS =
  'shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold';

export function ProjectHubStatusBadge({
  project,
  tabHint,
}: {
  project: Project;
  tabHint?: ProjectsHubTab;
}) {
  const status = resolveProjectHubStatus(project, tabHint);
  return (
    <StatusBadge
      label={PROJECT_HUB_STATUS_LABEL[status]}
      variant={PROJECT_HUB_STATUS_VARIANT[status]}
      dot
      className={PROJECT_HUB_STATUS_BADGE_CLASS}
    />
  );
}
