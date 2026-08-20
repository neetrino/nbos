export const PLATFORM_OWNERSHIP_SINGLETON_ID = 'current';

export const NBOS_FOUNDER_EMPLOYEE_ID_ENV = 'NBOS_FOUNDER_EMPLOYEE_ID';

export const PLATFORM_OWNER_ROLE_SLUG = 'owner';

export const CEO_ROLE_SLUG = 'ceo';

export const OWNERSHIP_TRANSFER_CONFIRMATION = 'TRANSFER_PLATFORM_OWNERSHIP';

export const CREDENTIAL_CONFIDENTIALITY_LEVELS = ['NORMAL', 'RESTRICTED', 'OWNER_ONLY'] as const;

export type CredentialConfidentiality = (typeof CREDENTIAL_CONFIDENTIALITY_LEVELS)[number];

export type PlatformOwnerIntegrityReason =
  | 'ok'
  | 'no_ownership_row'
  | 'env_missing'
  | 'mismatch'
  | 'inactive'
  | 'id_mismatch';
