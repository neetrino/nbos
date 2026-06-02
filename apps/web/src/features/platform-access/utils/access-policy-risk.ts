import type { AccessScopeMode, PlatformAccessAction, PlatformResourceFamily } from '@nbos/shared';
import type { RoleAccessPolicyRow } from '@/lib/api/platform-access';
import { ACCESS_POLICY_FAMILIES } from '../constants';

export const ACCESS_POLICY_CHANGE_REASON_MIN_LENGTH = 3;

export type RolePolicyDraft = Record<
  PlatformResourceFamily,
  { defaultLevel: PlatformAccessAction; scopeMode: AccessScopeMode }
>;

export function buildRolePolicyDraft(rows: RoleAccessPolicyRow[]): RolePolicyDraft {
  const draft = {} as RolePolicyDraft;
  for (const family of ACCESS_POLICY_FAMILIES) {
    const row = rows.find((item) => item.resourceFamily === family);
    draft[family] = {
      defaultLevel: row?.defaultLevel ?? 'VIEW',
      scopeMode: row?.scopeMode ?? 'ASSIGNED',
    };
  }
  return draft;
}

export function isRiskyRolePolicyChange(
  baseline: RoleAccessPolicyRow[],
  draft: RolePolicyDraft,
): boolean {
  for (const family of ACCESS_POLICY_FAMILIES) {
    const prev = baseline.find((row) => row.resourceFamily === family);
    const next = draft[family];
    if (next.scopeMode === 'NONE') return true;
    if (prev?.defaultLevel === 'EDIT' && next.defaultLevel === 'VIEW') return true;
    if (prev?.scopeMode === 'ALL' && next.scopeMode !== 'ALL') return true;
    if (prev?.scopeMode === 'ASSIGNED' && next.scopeMode === 'NONE') return true;
  }
  return false;
}

export function isRiskyPersonalOverride(
  level: PlatformAccessAction,
  scopeMode: AccessScopeMode,
): boolean {
  if (scopeMode === 'NONE') return true;
  if (level === 'EDIT' && scopeMode === 'ALL') return true;
  return false;
}

export function isValidChangeReason(reason: string): boolean {
  return reason.trim().length >= ACCESS_POLICY_CHANGE_REASON_MIN_LENGTH;
}
