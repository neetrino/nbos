export const FUNCTION_CATALOG_ALL_ID = 'all' as const;

export const FUNCTION_CATALOG_OTHER_ID = 'other' as const;

export const FUNCTION_CATALOG_RAIL_GRID_CLASS = 'grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]';

export const FUNCTION_CATALOG_CARD_GRID_CLASS =
  'grid w-full content-start gap-2 [grid-template-columns:repeat(auto-fill,minmax(min(100%,16rem),1fr))]';

export const FUNCTION_CATALOG_PICKER_DIALOG_CLASS =
  'flex max-h-[90vh] flex-col gap-4 overflow-hidden sm:max-w-5xl';

export const FUNCTION_CATALOG_PICKER_BODY_CLASS = 'min-h-0 flex-1 overflow-y-auto';

export const CATALOG_ICON_SIZE_PX = 20;

export const CATALOG_ICON_COMPACT_SIZE_PX = 16;

export const CATALOG_SUMMARY_CLAMP_CLASS = 'line-clamp-2';

export const TERMINAL_DELIVERY_STATUSES = ['DONE', 'LOST'] as const;

export const ACTIVE_FUNCTION_STATUS = 'ACTIVE' as const;

export const MATERIALIZED_PLAN_STATE = 'MATERIALIZED' as const;

export const REASON_FIELD_ID = 'catalog-picker-reason';

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
