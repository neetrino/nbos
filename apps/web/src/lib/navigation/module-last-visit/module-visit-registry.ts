import type { ModuleVisitConfig, RegisteredModuleKey } from './types';
import { FINANCE_MODULE_VISIT_CONFIG, isFinanceModulePath } from './finance-visit-config';

function startsWithPath(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

const CRM_SECTION_DEFAULTS = {
  dashboard: '/crm/dashboard',
  leads: '/crm/leads',
  deals: '/crm/deals',
} as const;

const MARKETING_SECTION_DEFAULTS = {
  board: '/marketing',
  attribution: '/marketing/attribution',
  dashboard: '/marketing/dashboard',
  settings: '/marketing/settings',
} as const;

const SUPPORT_SECTION_DEFAULTS = {
  tickets: '/support',
  'change-control': '/support/change-control',
} as const;

const CLIENTS_SECTION_DEFAULTS = {
  companies: '/clients/companies',
  contacts: '/clients/contacts',
} as const;

export const MODULE_VISIT_REGISTRY: Record<RegisteredModuleKey, ModuleVisitConfig> = {
  finance: FINANCE_MODULE_VISIT_CONFIG,
  crm: {
    kind: 'sections',
    defaultSection: 'leads',
    sectionDefaults: CRM_SECTION_DEFAULTS,
    resolveSection: (pathname) => {
      if (startsWithPath(pathname, '/crm/dashboard')) return 'dashboard';
      if (startsWithPath(pathname, '/crm/leads')) return 'leads';
      if (startsWithPath(pathname, '/crm/deals')) return 'deals';
      return null;
    },
    isPathInSection: (pathname, sectionId) => {
      const key = sectionId as keyof typeof CRM_SECTION_DEFAULTS;
      return startsWithPath(pathname, CRM_SECTION_DEFAULTS[key]);
    },
  },
  marketing: {
    kind: 'sections',
    defaultSection: 'board',
    sectionDefaults: MARKETING_SECTION_DEFAULTS,
    resolveSection: (pathname) => {
      if (pathname === '/marketing' || pathname.startsWith('/marketing?')) return 'board';
      if (startsWithPath(pathname, '/marketing/attribution')) return 'attribution';
      if (startsWithPath(pathname, '/marketing/dashboard')) return 'dashboard';
      if (startsWithPath(pathname, '/marketing/settings')) return 'settings';
      return null;
    },
    isPathInSection: (pathname, sectionId) => {
      const key = sectionId as keyof typeof MARKETING_SECTION_DEFAULTS;
      const base = MARKETING_SECTION_DEFAULTS[key];
      if (key === 'board') return pathname === '/marketing' || pathname.startsWith('/marketing?');
      return startsWithPath(pathname, base);
    },
  },
  support: {
    kind: 'sections',
    defaultSection: 'tickets',
    sectionDefaults: SUPPORT_SECTION_DEFAULTS,
    resolveSection: (pathname) => {
      if (startsWithPath(pathname, '/support/change-control')) return 'change-control';
      if (startsWithPath(pathname, '/support')) return 'tickets';
      return null;
    },
    isPathInSection: (pathname, sectionId) => {
      if (sectionId === 'change-control') {
        return startsWithPath(pathname, '/support/change-control');
      }
      return (
        pathname === '/support' ||
        (pathname.startsWith('/support/') && !pathname.startsWith('/support/change-control'))
      );
    },
  },
  clients: {
    kind: 'sections',
    defaultSection: 'companies',
    sectionDefaults: CLIENTS_SECTION_DEFAULTS,
    resolveSection: (pathname) => {
      if (startsWithPath(pathname, '/clients/companies')) return 'companies';
      if (startsWithPath(pathname, '/clients/contacts')) return 'contacts';
      return null;
    },
    isPathInSection: (pathname, sectionId) => {
      const key = sectionId as keyof typeof CLIENTS_SECTION_DEFAULTS;
      return startsWithPath(pathname, CLIENTS_SECTION_DEFAULTS[key]);
    },
  },
  'my-company': {
    kind: 'flat',
    defaultPath: '/my-company',
    isModulePath: (pathname) => startsWithPath(pathname, '/my-company'),
    isValidPath: (pathname) => startsWithPath(pathname, '/my-company'),
  },
  credentials: {
    kind: 'flat',
    defaultPath: '/credentials',
    isModulePath: (pathname) => startsWithPath(pathname, '/credentials'),
    isValidPath: (pathname) => startsWithPath(pathname, '/credentials'),
  },
};

export function isRegisteredModuleKey(key: string): key is RegisteredModuleKey {
  return key in MODULE_VISIT_REGISTRY;
}

export function resolveRegisteredModuleFromPathname(pathname: string): RegisteredModuleKey | null {
  if (isFinanceModulePath(pathname)) return 'finance';
  for (const moduleKey of Object.keys(MODULE_VISIT_REGISTRY) as RegisteredModuleKey[]) {
    if (moduleKey === 'finance') continue;
    const config = MODULE_VISIT_REGISTRY[moduleKey];
    if (config.kind === 'flat' && config.isModulePath(pathname)) return moduleKey;
    if (config.kind === 'sections' && config.resolveSection(pathname)) return moduleKey;
  }
  return null;
}
