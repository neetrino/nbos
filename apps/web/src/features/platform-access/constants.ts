import {
  ACCESS_SCOPE_MODES,
  PLATFORM_ACCESS_ACTIONS,
  PLATFORM_RESOURCE_FAMILIES,
} from '@nbos/shared';

export const ACCESS_POLICY_SCOPE_OPTIONS = ACCESS_SCOPE_MODES;
export const ACCESS_POLICY_LEVEL_OPTIONS = PLATFORM_ACCESS_ACTIONS;
export const ACCESS_POLICY_FAMILIES = PLATFORM_RESOURCE_FAMILIES;

export function formatResourceFamilyLabel(family: string): string {
  return family.replace(/_/g, ' ');
}
