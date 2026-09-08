import type { ProjectHubSectionId } from '@/lib/navigation/module-last-visit/project-hub-module-last-visit';

export type ProjectHubHeaderZoneDefinition = {
  zone: ProjectHubSectionId;
  label: string;
};

export const PROJECT_HUB_HEADER_ZONES: ProjectHubHeaderZoneDefinition[] = [
  { zone: 'projects', label: 'Project' },
  { zone: 'products', label: 'Product' },
];
