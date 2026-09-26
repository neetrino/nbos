import type { RolePermissionScope } from './role-permissions-types';

/** Visual tone for a scope so granted access is readable at a glance. */
export function rolePermissionScopeTone(scope: RolePermissionScope): string {
  if (scope === 'OWN') {
    return 'border-sky-500/35 bg-sky-500/10 text-sky-800 dark:border-sky-400/40 dark:bg-sky-400/15 dark:text-sky-200';
  }
  if (scope === 'DEPARTMENT') {
    return 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-100';
  }
  if (scope === 'ALL') {
    return 'border-emerald-500/35 bg-emerald-500/15 text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-400/15 dark:text-emerald-200';
  }
  return '';
}
