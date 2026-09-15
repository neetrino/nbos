import { CREDENTIAL_CATEGORY_CATALOG } from '@nbos/shared';
import type { StatusVariant } from '@/components/shared/StatusBadge';

export const CREDENTIAL_CATEGORIES = CREDENTIAL_CATEGORY_CATALOG.map((entry) => ({
  value: entry.category,
  label: entry.label,
}));

const CATEGORY_MESSAGE_VALUES = new Set<string>([
  ...CREDENTIAL_CATEGORIES.map((item) => item.value),
  'OTHER',
]);

export const CREDENTIAL_TYPES = [
  { value: 'LOGIN_PASSWORD', label: 'Login / Password' },
  { value: 'API_KEY', label: 'API key / Token' },
  { value: 'DATABASE', label: 'Database' },
  { value: 'SSH_PRIVATE_KEY', label: 'SSH / Private key' },
  { value: 'ENV_BUNDLE', label: 'ENV bundle' },
  { value: 'DOMAIN_REGISTRAR', label: 'Domain registrar' },
  { value: 'HOSTING_SERVER', label: 'Hosting / Server' },
  { value: 'APP_STORE_ACCOUNT', label: 'App Store account' },
  { value: 'MAIL_SMTP', label: 'Mail / SMTP' },
  { value: 'RECOVERY_CODES', label: 'Recovery codes' },
] as const;

export const CREDENTIAL_CRITICALITIES = [
  { value: 'LOW', label: 'Low', variant: 'gray' as StatusVariant },
  { value: 'MEDIUM', label: 'Medium', variant: 'blue' as StatusVariant },
  { value: 'HIGH', label: 'High', variant: 'amber' as StatusVariant },
  { value: 'CRITICAL', label: 'Critical', variant: 'red' as StatusVariant },
] as const;

/** Stored access levels on credentials (not the vault «All» scope tab). */
export const ACCESS_LEVELS = [
  { value: 'SECRET', label: 'Secret', variant: 'red' as StatusVariant },
  { value: 'PROJECT_TEAM', label: 'Project', variant: 'blue' as StatusVariant },
  { value: 'DEPARTMENT', label: 'Team', variant: 'purple' as StatusVariant },
  { value: 'ALL', label: 'Company', variant: 'green' as StatusVariant },
  { value: 'PERSONAL', label: 'My', variant: 'gray' as StatusVariant },
] as const;

export function getAccessLevel(value: string) {
  return ACCESS_LEVELS.find((l) => l.value === value);
}

/** Human label for access column; vault «All» tab is not a stored access level. */
export function formatCredentialAccessLabel(accessLevel: string): string {
  return getAccessLevel(accessLevel)?.label ?? accessLevel.replaceAll('_', ' ');
}

export function getCredentialCriticality(value: string) {
  return CREDENTIAL_CRITICALITIES.find((item) => item.value === value);
}

export function credentialCategoryMessageKey(value: string): `categories.${string}` | null {
  return CATEGORY_MESSAGE_VALUES.has(value) ? `categories.${value}` : null;
}

export function credentialTypeMessageKey(value: string): `types.${string}` | null {
  return CREDENTIAL_TYPES.some((item) => item.value === value) ? `types.${value}` : null;
}

export function credentialCriticalityMessageKey(value: string): `criticality.${string}` | null {
  return CREDENTIAL_CRITICALITIES.some((item) => item.value === value)
    ? `criticality.${value}`
    : null;
}

export function credentialAccessMessageKey(value: string): `access.${string}` | null {
  return ACCESS_LEVELS.some((item) => item.value === value) ? `access.${value}` : null;
}
