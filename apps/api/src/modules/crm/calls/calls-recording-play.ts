import { ForbiddenException } from '@nestjs/common';
import {
  CRM_CALL_RECORDINGS_MODULE,
  CRM_CALL_RECORDINGS_PLAY_ACTION,
  CRM_CALL_RECORDINGS_PLAY_PERMISSION,
} from '@nbos/shared';

export function hasCrmCallRecordingsPlay(permissions: Record<string, string | undefined>): boolean {
  const scope = permissions[CRM_CALL_RECORDINGS_PLAY_PERMISSION]?.trim().toUpperCase();
  return Boolean(scope && scope !== 'NONE');
}

export function assertCanPlayCallRecording(permissions: Record<string, string | undefined>): void {
  if (hasCrmCallRecordingsPlay(permissions)) return;
  throw new ForbiddenException(
    `No permission: ${CRM_CALL_RECORDINGS_MODULE}.${CRM_CALL_RECORDINGS_PLAY_ACTION}`,
  );
}
