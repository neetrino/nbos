export {
  PROJECT_HUB_MODULE_VISIT_CONFIG,
  PROJECT_HUB_SECTION_DEFAULTS,
  isProjectHubDirectoryPath,
  isProjectHubModulePath,
  isProjectHubSectionPath,
  resolveProjectHubSectionId,
  type ProjectHubSectionId,
} from './project-hub-visit-config';

import { readModuleSectionHref } from './module-last-visit-storage';
import type { ProjectHubSectionId } from './project-hub-visit-config';

export function readProjectHubSectionHref(sectionId: ProjectHubSectionId): string {
  return readModuleSectionHref('project-hub', sectionId);
}

export { writeModuleLastVisitFromPathname } from './module-last-visit-storage';
