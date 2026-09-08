import type { SectionModuleVisitConfig } from './types';

export type ProjectHubSectionId = 'projects' | 'products';

export const PROJECT_HUB_SECTION_DEFAULTS: Record<ProjectHubSectionId, string> = {
  projects: '/projects',
  products: '/projects/products',
};

const PRODUCT_WORKSPACE_PATTERN = /^\/projects\/[^/]+\/products(?:\/|$)/;

function normalizePath(pathname: string): string {
  return pathname.split('?')[0] ?? pathname;
}

export function resolveProjectHubSectionId(pathname: string): ProjectHubSectionId | null {
  const path = normalizePath(pathname);
  if (path === '/projects/products' || path.startsWith('/projects/products/')) {
    return 'products';
  }
  if (PRODUCT_WORKSPACE_PATTERN.test(path)) return 'products';
  if (path === '/projects' || path.startsWith('/projects/')) return 'projects';
  return null;
}

export function isProjectHubSectionPath(
  pathname: string,
  sectionId: ProjectHubSectionId,
): boolean {
  return resolveProjectHubSectionId(pathname) === sectionId;
}

export function isProjectHubDirectoryPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return path === '/projects' || path === '/projects/products';
}

export function isProjectHubModulePath(pathname: string): boolean {
  return resolveProjectHubSectionId(pathname) !== null;
}

export const PROJECT_HUB_MODULE_VISIT_CONFIG: SectionModuleVisitConfig = {
  kind: 'sections',
  defaultSection: 'products',
  sectionDefaults: PROJECT_HUB_SECTION_DEFAULTS,
  resolveSection: resolveProjectHubSectionId,
  isPathInSection: (pathname, sectionId) =>
    isProjectHubSectionPath(pathname, sectionId as ProjectHubSectionId),
  resolveStoredPath: (_pathname, sectionId) => {
    const key = sectionId as ProjectHubSectionId;
    return PROJECT_HUB_SECTION_DEFAULTS[key] ?? PROJECT_HUB_SECTION_DEFAULTS.products;
  },
};
