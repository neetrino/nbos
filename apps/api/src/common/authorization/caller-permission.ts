import { ForbiddenException } from '@nestjs/common';
import type { CurrentUserPayload } from '../decorators';

function hasNonNoneScope(permissions: Record<string, string | undefined>, key: string): boolean {
  const scope = permissions[key]?.trim().toUpperCase();
  return Boolean(scope && scope !== 'NONE');
}

export function hasCallerPermission(
  permissions: Record<string, string | undefined>,
  module: string,
  action: string,
): boolean {
  return hasNonNoneScope(permissions, `${module}_${action}`);
}

/**
 * Conjunctive second-permission check. PermissionGuard arrays are OR, so cross-entity
 * actions assert the target module here (same ForbiddenException shape as the guard /
 * `assertCallCreatePermission` / `assertCanPlayCallRecording`).
 */
export function assertCallerHasPermission(
  user: CurrentUserPayload,
  module: string,
  action: string,
): void {
  if (hasCallerPermission(user.permissions, module, action)) return;
  throw new ForbiddenException(`No permission: ${module}.${action}`);
}
