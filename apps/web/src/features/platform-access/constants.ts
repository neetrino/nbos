import {
  ACCESS_SCOPE_MODES,
  PLATFORM_ACCESS_ACTIONS,
  PLATFORM_RESOURCE_FAMILIES,
} from '@nbos/shared';

export const ACCESS_POLICY_SCOPE_OPTIONS = ACCESS_SCOPE_MODES;
export const ACCESS_POLICY_LEVEL_OPTIONS = PLATFORM_ACCESS_ACTIONS;
export const ACCESS_POLICY_FAMILIES = PLATFORM_RESOURCE_FAMILIES;

/** Project team sidebar — changes on writes, safe to cache briefly between navigations. */
export const PROJECT_TEAM_CACHE_TTL_MS = 5 * 60 * 1000;

export function formatResourceFamilyLabel(family: string): string {
  return family.replace(/_/g, ' ');
}
