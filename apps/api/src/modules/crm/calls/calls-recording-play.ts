import { ForbiddenException } from '@nestjs/common';
import {
  CALLS_MODULE,
  CALLS_PLAY_ACTION,
  CALLS_PLAY_PERMISSION,
  CRM_CALL_RECORDINGS_PLAY_PERMISSION,
} from '@nbos/shared';

function hasNonNoneScope(permissions: Record<string, string | undefined>, key: string): boolean {
  const scope = permissions[key]?.trim().toUpperCase();
  return Boolean(scope && scope !== 'NONE');
}

export function hasCallRecordingsPlay(permissions: Record<string, string | undefined>): boolean {
  return (
    hasNonNoneScope(permissions, CALLS_PLAY_PERMISSION) ||
    hasNonNoneScope(permissions, CRM_CALL_RECORDINGS_PLAY_PERMISSION)
  );
}

/** @deprecated Prefer hasCallRecordingsPlay. Kept for existing tests and callers. */
export function hasCrmCallRecordingsPlay(permissions: Record<string, string | undefined>): boolean {
  return hasCallRecordingsPlay(permissions);
}

export function assertCanPlayCallRecording(permissions: Record<string, string | undefined>): void {
  if (hasCallRecordingsPlay(permissions)) return;
  throw new ForbiddenException(`No permission: ${CALLS_MODULE}.${CALLS_PLAY_ACTION}`);
}
