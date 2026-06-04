/** Delivery / CRM graphs — inherit `PUBLIC_INTERNAL` and `CONFIDENTIAL` only. */
export const DRIVE_GENERAL_INHERITED_LINK_ENTITY_TYPES = [
  'PROJECT',
  'DEAL',
  'PRODUCT',
  'EXTENSION',
  'TASK',
  'WORK_SPACE',
] as const;

/** Finance hub links — required for `FINANCE_SENSITIVE` inherited visibility. */
export const DRIVE_FINANCE_INHERITED_LINK_ENTITY_TYPES = ['INVOICE', 'PAYMENT', 'EXPENSE'] as const;

/** Legal / partner / client context — required for `LEGAL_SENSITIVE` inherited visibility. */
export const DRIVE_LEGAL_INHERITED_LINK_ENTITY_TYPES = [
  'PARTNER',
  'COMPANY',
  'CONTACT',
  'CLIENT_SERVICE_RECORD',
] as const;

export const DRIVE_GENERAL_CONFIDENTIALITIES = ['PUBLIC_INTERNAL', 'CONFIDENTIAL'] as const;

export type DriveInheritedLinkTarget = { entityType: string; entityId: string };
