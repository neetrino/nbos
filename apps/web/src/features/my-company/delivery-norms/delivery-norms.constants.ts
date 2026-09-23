import type { DeliveryCompensationRoleKey, DeliveryNormativeStatus } from '@nbos/shared';
import type { StatusVariant } from '@/components/shared';

export const SECTION_CARD_CLASS =
  'border-border bg-card space-y-5 rounded-2xl border p-5 max-md:p-4';

export const FORM_BLOCK_CLASS =
  'border-border/60 bg-muted/10 space-y-4 rounded-2xl border p-4 max-md:p-3';

export const RECORD_ROW_CLASS =
  'border-border/60 bg-muted/10 space-y-2 rounded-2xl border px-4 py-3';

export const CHECKBOX_ROW_CLASS =
  'border-border/50 bg-background/50 hover:bg-muted/40 flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm';

export const CHECKBOX_ROW_ACTIVE_CLASS = 'border-primary bg-primary/10 hover:bg-primary/15';

export const OVERVIEW_COUNT_CARD_CLASS =
  'border-border/70 bg-card hover:bg-primary/[0.04] space-y-2 rounded-2xl border p-4 text-left shadow-[var(--shadow-panel)]';

export const MAP_STEP_CLASS =
  'border-border/70 bg-card space-y-3 rounded-2xl border p-4 shadow-[var(--shadow-panel)]';

export const LOADING_CARD_COUNT = 3;

export const LOADING_LIST_COUNT = 4;

export const CORE_ITEM_INDEX_STEP = 1;

export const TARGET_KEY_SEPARATOR = ':';

export const SALE_PRICE_TARGET_KINDS = ['FUNCTION', 'TIER', 'CORE'] as const;

export type SalePriceTargetKind = (typeof SALE_PRICE_TARGET_KINDS)[number];

export const PICKER_CHIP_CLASS =
  'border-border/60 bg-muted/10 hover:bg-muted/30 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors';

export const PICKER_CHIP_ACTIVE_CLASS = 'border-primary bg-primary/10 hover:bg-primary/15';

export const SEED_ROLE_RATE_AMD = '1000';

export const ISO_CALENDAR_DATE_LENGTH = 10;

export const OPTIONAL_SELECT_NONE = 'none';

export const PROFILE_LABEL_SEPARATOR = ' · ';

export const PROFILE_VERSION_PREFIX = 'v';

export const ZERO_UNITS_CONFIRMATION_MESSAGE = 'ZERO_UNITS_CONFIRMATION_REQUIRED';

export const INCLUDED_FUNCTIONS_LIST_CLASS =
  'max-h-[min(24rem,55vh)] space-y-3 overflow-y-auto pr-1';

export const CHECKBOX_ITEMS_GRID_CLASS = 'grid gap-2 lg:grid-cols-2';

export const COLLECTION_CHIPS_GRID_CLASS = 'grid gap-2 sm:grid-cols-2 lg:grid-cols-3';

export const GROUP_HEADING_CLASS =
  'text-muted-foreground text-[11px] font-semibold tracking-wide uppercase';

export const WORKSPACE_SPLIT_CLASS =
  'grid gap-5 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] lg:items-start';

export const WORKSPACE_PAIR_CLASS = 'grid gap-5 lg:grid-cols-2 lg:items-start';

export const TOOLBAR_ROW_CLASS = 'flex flex-wrap items-center justify-between gap-3';

export const PICKER_LIST_CLASS = 'max-h-[min(32rem,70vh)] space-y-2 overflow-y-auto pr-1';

export const SEARCH_SELECT_MAX_RESULTS = 24;

export const NORMS_SHEET_HEADER_CLASS = 'border-border shrink-0 space-y-3 border-b px-5 py-3';

export const NORMS_SHEET_BODY_CLASS = 'min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4';

export const NORMS_SHEET_FOOTER_CLASS = 'px-5 py-3';

export const NORMS_LIST_GRID_CLASS = 'grid gap-3 lg:grid-cols-2';

export const ROLE_UNITS_BREAKDOWN_CLASS = 'flex flex-col gap-3';

export const SHEET_STACK_CLASS = 'flex flex-col gap-3';

/** Current published rate + new draft amount, side by side in the rates sheet. */
export const NORMS_SHEET_FIELD_PAIR_CLASS = 'grid min-w-0 flex-1 grid-cols-2 gap-4';

export const NORMS_INLINE_MONEY_ROW_CLASS = 'flex items-end gap-3';

export const NORMS_SHEET_ROLE_BLOCK_CLASS = 'flex flex-col gap-3 py-4 first:pt-0 last:pb-0';

export const LIST_SEARCH_MAX_CLASS = 'min-w-[12rem] max-w-sm flex-1';

export const STATUS_BADGE_VARIANT: Record<DeliveryNormativeStatus, StatusVariant> = {
  DRAFT: 'amber',
  PUBLISHED: 'emerald',
  ARCHIVED: 'gray',
};

export const ROLE_MESSAGE_KEYS = {
  BACKEND: 'roles.BACKEND',
  FRONTEND: 'roles.FRONTEND',
  PM: 'roles.PM',
  DESIGNER: 'roles.DESIGNER',
  QA: 'roles.QA',
  TECHNICAL_SPECIALIST: 'roles.TECHNICAL_SPECIALIST',
} as const satisfies Record<DeliveryCompensationRoleKey, `roles.${DeliveryCompensationRoleKey}`>;
