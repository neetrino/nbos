/** Stable keys for top-level sidebar modules (personal order / hide preferences). */
export const SIDEBAR_MODULE_KEYS = [
  'dashboard',
  'crm',
  'marketing',
  'project-hub',
  'delivery-board',
  'tasks',
  'work-spaces',
  'finance',
  'support',
  'clients',
  'partners',
  'my-company',
  'messenger',
  'calendar',
  'drive',
  'documents',
  'mail',
  'credentials',
  'reports',
  'settings',
] as const;

export type SidebarModuleKey = (typeof SIDEBAR_MODULE_KEYS)[number];

export const SIDEBAR_MODULE_MAX_COUNT = SIDEBAR_MODULE_KEYS.length;

export const DEFAULT_SIDEBAR_MODULE_ORDER: readonly SidebarModuleKey[] = SIDEBAR_MODULE_KEYS;

/** Modules that cannot be hidden from the primary sidebar list. */
export const SIDEBAR_MODULE_KEYS_NON_HIDABLE: readonly SidebarModuleKey[] = ['dashboard'];
