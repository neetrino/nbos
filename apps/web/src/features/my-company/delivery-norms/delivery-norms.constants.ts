import type { DeliveryCompensationRoleKey, DeliveryNormativeStatus } from '@nbos/shared';
import type { StatusVariant } from '@/components/shared';

export const SECTION_CARD_CLASS =
  'border-border bg-card space-y-5 rounded-2xl border p-5 max-md:p-4';

export const FORM_BLOCK_CLASS =
  'border-border/60 bg-muted/10 space-y-4 rounded-2xl border p-4 max-md:p-3';

export const RECORD_ROW_CLASS =
  'border-border/60 bg-muted/10 space-y-2 rounded-2xl border px-4 py-3';

export const CHECKBOX_ROW_CLASS =
  'border-border/50 bg-background/50 hover:bg-muted/40 flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm';

export const CHECKBOX_ROW_ACTIVE_CLASS = 'border-primary bg-primary/10 hover:bg-primary/15';

export const OVERVIEW_COUNT_CARD_CLASS =
  'border-border/70 bg-card hover:bg-primary/[0.04] space-y-2 rounded-2xl border p-4 text-left shadow-[var(--shadow-panel)]';

export const MAP_STEP_CLASS =
  'border-border/70 bg-card space-y-3 rounded-2xl border p-4 shadow-[var(--shadow-panel)]';

export const LOADING_CARD_COUNT = 3;

export const LOADING_LIST_COUNT = 4;

export const CORE_ITEM_INDEX_STEP = 1;

export const SALE_PRICE_ZERO = 0;

export const TARGET_KEY_SEPARATOR = ':';

export const SALE_PRICE_TARGET_KINDS = ['FUNCTION', 'TIER', 'CORE'] as const;

export type SalePriceTargetKind = (typeof SALE_PRICE_TARGET_KINDS)[number];

export const SIZE_PRESET_LEVEL_CLASS =
  'border-border/60 bg-muted/10 hover:bg-muted/30 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors';

export const SIZE_PRESET_LEVEL_ACTIVE_CLASS = 'border-primary bg-primary/10 hover:bg-primary/15';

export const SEED_ROLE_RATE_AMD = '1000';

export const ISO_CALENDAR_DATE_LENGTH = 10;

export const OPTIONAL_SELECT_NONE = 'none';

export const ZERO_UNITS_CONFIRMATION_MESSAGE = 'ZERO_UNITS_CONFIRMATION_REQUIRED';

export const INCLUDED_FUNCTIONS_LIST_CLASS = 'max-h-64 space-y-2 overflow-y-auto pr-1';

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
