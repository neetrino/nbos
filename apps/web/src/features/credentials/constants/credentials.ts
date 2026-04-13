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

export const ACCESS_LEVELS = [
  { value: 'SECRET', label: 'Secret', variant: 'red' as StatusVariant },
  { value: 'PROJECT_TEAM', label: 'Project Team', variant: 'blue' as StatusVariant },
  { value: 'DEPARTMENT', label: 'Department', variant: 'purple' as StatusVariant },
  { value: 'ALL', label: 'All', variant: 'green' as StatusVariant },
  { value: 'PERSONAL', label: 'Personal', variant: 'gray' as StatusVariant },
] as const;

export function getAccessLevel(value: string) {
  return ACCESS_LEVELS.find((l) => l.value === value);
}
