export const FUNCTION_CATALOG_ALL_ID = 'all' as const;

/** Visible first screen on the 3-column Functions grid; more pages load on scroll. */
export const CATALOG_PAGE_SIZE = 12;

export const FUNCTION_CATALOG_OTHER_ID = 'other' as const;

export const FUNCTION_CATALOG_RAIL_GRID_CLASS = 'grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]';

export const FUNCTION_CATALOG_CARD_GRID_CLASS =
  'grid w-full content-start grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3';

export const FUNCTION_CATALOG_SHEET_CARD_GRID_CLASS =
  'grid w-full auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3';

export const FUNCTION_CATALOG_SELECTED_CARD_CLASS =
  'border-emerald-500/45 bg-emerald-500/10 dark:border-emerald-400/40 dark:bg-emerald-500/15';

export const FUNCTION_CATALOG_COLLECTION_CHIP_CLASS = 'h-7 shrink-0 rounded-full px-3 text-xs';

export const CATALOG_ICON_SIZE_PX = 16;

export const CATALOG_ICON_COMPACT_SIZE_PX = 14;

export const TERMINAL_DELIVERY_STATUSES = ['DONE', 'LOST'] as const;

export const ACTIVE_FUNCTION_STATUS = 'ACTIVE' as const;

export const MATERIALIZED_PLAN_STATE = 'MATERIALIZED' as const;

export const REASON_FIELD_ID = 'catalog-picker-reason';

export const REMOVE_REASON_FIELD_ID = 'catalog-remove-reason';

export const PUBLISHED_PRICE_STATUS = 'PUBLISHED' as const;

export const DRAFT_PRICE_STATUS = 'DRAFT' as const;

export const FUNCTION_TIER_REQUIRED_CODE = 'FUNCTION_TIER_REQUIRED' as const;

export const STATUS_LABEL_KEY = {
  DRAFT: 'statusDraft',
  ACTIVE: 'statusActive',
  ARCHIVED: 'statusArchived',
} as const;

export type FunctionCatalogStatusLabelKey =
  (typeof STATUS_LABEL_KEY)[keyof typeof STATUS_LABEL_KEY];

export const FUNCTION_CATALOG_CATEGORY_MESSAGE_KEYS = {
  all: 'categories.all',
  other: 'categories.other',
  payments: 'categories.payments',
  commerce: 'categories.commerce',
  logistics: 'categories.logistics',
  messaging: 'categories.messaging',
  accounts: 'categories.accounts',
  content: 'categories.content',
  loyalty: 'categories.loyalty',
  booking: 'categories.booking',
  learning: 'categories.learning',
  crm_ops: 'categories.crm_ops',
  finance_ops: 'categories.finance_ops',
  hr_ops: 'categories.hr_ops',
  analytics: 'categories.analytics',
  ai: 'categories.ai',
  integrations: 'categories.integrations',
  platform: 'categories.platform',
  mobile: 'categories.mobile',
  desktop: 'categories.desktop',
  services: 'categories.services',
} as const;
