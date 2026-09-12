import {
  ApiError,
  isCalendarMeetingConflictApiError,
  isPermissionDeniedApiError,
} from '@/lib/api-errors';

export type LocalizedApiErrorCopy = {
  permissionDenied: string;
  generic: string;
  validation: string;
  conflict: string;
  network: string;
};

/**
 * Maps first-release API failures to catalog copy by status/code.
 * Does not return raw server English or substitute message strings.
 */
export function localizeCaughtApiError(caught: unknown, copy: LocalizedApiErrorCopy): string {
  if (isPermissionDeniedApiError(caught)) {
    return copy.permissionDenied;
  }
  if (isCalendarMeetingConflictApiError(caught)) {
    return copy.conflict;
  }
  if (caught instanceof ApiError && caught.errors.length > 0) {
    return copy.validation;
  }
  if (caught instanceof ApiError && caught.statusCode === undefined && caught.code === undefined) {
    return copy.network;
  }
  return copy.generic;
}

export function firstReleaseFormErrorCopy(
  permissionDenied: string,
  generic: string,
  validation: string,
  conflict: string,
  network: string,
): LocalizedApiErrorCopy {
  return { permissionDenied, generic, validation, conflict, network };
}
