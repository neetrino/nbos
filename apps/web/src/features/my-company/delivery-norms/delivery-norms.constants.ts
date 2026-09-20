import type { DeliveryCompensationRoleKey, DeliveryNormativeStatus } from '@nbos/shared';
import type { StatusVariant } from '@/components/shared';

export const SECTION_CARD_CLASS = 'border-border bg-card space-y-4 rounded-2xl border p-4';

export const LOADING_CARD_COUNT = 3;

export const LOADING_LIST_COUNT = 4;

export const CORE_ITEM_INDEX_STEP = 1;

export const SALE_PRICE_ZERO = 0;

export const TARGET_KEY_SEPARATOR = ':';

export const SALE_PRICE_TARGET_KINDS = ['FUNCTION', 'TIER', 'CORE'] as const;

export type SalePriceTargetKind = (typeof SALE_PRICE_TARGET_KINDS)[number];

export const CORE_ITEM_ROW_CLASS =
  'grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-end';

export const SIZE_PRESET_LEVEL_CLASS =
  'border-border flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm';

export const SIZE_PRESET_LEVEL_ACTIVE_CLASS = 'border-foreground bg-muted/60';

export const SEED_ROLE_RATE_AMD = '1000';

export const ISO_CALENDAR_DATE_LENGTH = 10;

export const OPTIONAL_SELECT_NONE = 'none';

export const ZERO_UNITS_CONFIRMATION_MESSAGE = 'ZERO_UNITS_CONFIRMATION_REQUIRED';

export const INCLUDED_FUNCTIONS_LIST_CLASS = 'max-h-56 space-y-1 overflow-y-auto pr-1';

export const ROLE_RATE_GRID_CLASS = 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3';

export const PROFILE_FORM_GRID_CLASS = 'grid gap-3 sm:grid-cols-2';

export const ROLE_UNIT_ROW_CLASS =
  'grid gap-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]';

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
