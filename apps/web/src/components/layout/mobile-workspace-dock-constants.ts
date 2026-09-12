export const MOBILE_WORKSPACE_SEARCH_LABEL = 'Search';
export const MOBILE_WORKSPACE_CREATE_LABEL = 'New';
export const MOBILE_WORKSPACE_SETTINGS_LABEL = 'Settings';
export const MOBILE_WORKSPACE_DEFAULT_SCOPE_LABEL = 'All';

export const MOBILE_WORKSPACE_SWITCHER_ZONE_TITLE = 'Zone';
export const MOBILE_WORKSPACE_SWITCHER_SECTION_TITLE = 'Section';
export const MOBILE_WORKSPACE_SWITCHER_CATEGORY_TITLE = 'Category';
export const MOBILE_WORKSPACE_SWITCHER_VIEW_TITLE = 'View';
export const MOBILE_WORKSPACE_SWITCHER_MULTI_TITLE = 'Go to';

export const MOBILE_DOCK_SWITCHER_GROUP_TITLE_KEYS = {
  zone: 'mobileDock.zone',
  section: 'mobileDock.section',
  category: 'mobileDock.category',
  view: 'mobileDock.view',
} as const satisfies Record<
  string,
  import('@/lib/navigation/nav-message-keys').NavigationMessageKey
>;

export type MobileDockSwitcherGroupId = keyof typeof MOBILE_DOCK_SWITCHER_GROUP_TITLE_KEYS;

export const MOBILE_WORKSPACE_SCOPE_LABEL_CLASS =
  'flex h-4 max-w-full min-w-0 items-center justify-center gap-0.5 overflow-hidden';
export const MOBILE_WORKSPACE_SCOPE_CARET_CLASS = 'shrink-0 opacity-70';
export const MOBILE_WORKSPACE_SCOPE_CARET_SIZE = 10;
