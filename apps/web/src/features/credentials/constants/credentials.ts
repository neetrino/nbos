import type { StatusVariant } from '@/components/shared/StatusBadge';

export const CREDENTIAL_CATEGORIES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'DOMAIN', label: 'Domain' },
  { value: 'HOSTING', label: 'Hosting' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'APP', label: 'App Store' },
  { value: 'MAIL', label: 'Mail' },
  { value: 'API_KEY', label: 'API Key' },
  { value: 'DATABASE', label: 'Database' },
  { value: 'OTHER', label: 'Other' },
] as const;

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
