import type { SidebarModuleKey } from '@nbos/shared/constants';

export type SectionModuleVisitConfig = {
  kind: 'sections';
  defaultSection: string;
  sectionDefaults: Record<string, string>;
  resolveSection: (pathname: string) => string | null;
  isPathInSection: (pathname: string, sectionId: string) => boolean;
};

export type FlatModuleVisitConfig = {
  kind: 'flat';
  defaultPath: string;
  isModulePath: (pathname: string) => boolean;
  isValidPath: (pathname: string) => boolean;
};

export type ModuleVisitConfig = SectionModuleVisitConfig | FlatModuleVisitConfig;

export type SectionModuleVisitState = {
  kind: 'sections';
  lastSection?: string;
  sectionPaths: Record<string, string>;
};

export type FlatModuleVisitState = {
  kind: 'flat';
  lastPath?: string;
};

export type ModuleVisitState = SectionModuleVisitState | FlatModuleVisitState;

export type RegisteredModuleKey = Extract<
  SidebarModuleKey,
  'finance' | 'crm' | 'marketing' | 'support' | 'clients' | 'my-company'
>;
