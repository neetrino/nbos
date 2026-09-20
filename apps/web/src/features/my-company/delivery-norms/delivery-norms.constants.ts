import type { DeliveryCompensationRoleKey, DeliveryNormativeStatus } from '@nbos/shared';
import type { StatusVariant } from '@/components/shared';

export const SECTION_CARD_CLASS = 'border-border bg-card space-y-4 rounded-2xl border p-4';

export const LOADING_CARD_COUNT = 3;

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
