import type { DeliveryCompensationRoleKey, RedistributionValidationError } from '@nbos/shared';

export const UNSELECTED_ROLE = '' as const;

export const UNSELECTED_EMPLOYEE_ID = '' as const;

export const EMPTY_SHARE_PERCENT = '' as const;

export const REPLACEMENT_CONFLICT_HTTP_STATUS = 409;

export const REPLACEMENT_CONFLICT_CODE = 'CONFIGURATION_CONFLICT';

export const ROLE_LABEL_KEYS = {
  BACKEND: 'replaceAssignee.roles.BACKEND',
  FRONTEND: 'replaceAssignee.roles.FRONTEND',
  PM: 'replaceAssignee.roles.PM',
  DESIGNER: 'replaceAssignee.roles.DESIGNER',
  QA: 'replaceAssignee.roles.QA',
  TECHNICAL_SPECIALIST: 'replaceAssignee.roles.TECHNICAL_SPECIALIST',
} as const satisfies Record<
  DeliveryCompensationRoleKey,
  `replaceAssignee.roles.${DeliveryCompensationRoleKey}`
>;

export const SHARE_VALIDATION_MESSAGE_KEYS = {
  REDISTRIBUTION_REQUIRED: 'replaceAssignee.undecided',
  SHARE_PERCENT_TOTAL: 'replaceAssignee.mustSumTo100',
} as const satisfies Record<RedistributionValidationError, string>;

export const HOLDER_PERCENT_ROW_CLASS =
  'grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(4.5rem,6rem)]';

export const COMPONENT_CARD_CLASS = 'border-border space-y-3 rounded-xl border p-3';
