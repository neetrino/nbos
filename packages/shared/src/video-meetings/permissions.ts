/**
 * Video Meetings authorization helpers for domain tests and later API gates.
 * CALLS permissions and entity links never grant Video Meetings access.
 */

import {
  CALLS_MODULE,
  CALLS_PLAY_PERMISSION,
  CALLS_VIEW_PERMISSION,
} from '../constants/calls-play';
import {
  VIDEO_MEETINGS_MODULE,
  VIDEO_MEETINGS_VIEW,
} from '../constants/video-meetings-permissions';

export type PermissionMap = Readonly<Record<string, string>>;

export type VideoMeetingEntityLinkRef = {
  entityType: 'DEAL' | 'PROJECT' | 'PRODUCT' | 'CONTACT';
  entityId: string;
};

const NONE_SCOPES = new Set(['', 'NONE']);

function scopeOf(permissions: PermissionMap, key: string): string | undefined {
  return permissions[key];
}

export function hasVideoMeetingsPermission(
  permissions: PermissionMap,
  action: 'VIEW' | 'EDIT' | 'ADD' | 'DELETE' = 'VIEW',
): boolean {
  const key = `${VIDEO_MEETINGS_MODULE}_${action}`;
  const scope = scopeOf(permissions, key);
  if (scope == null || NONE_SCOPES.has(scope)) return false;
  return true;
}

/** CALLS VIEW/PLAY (or any CALLS_*) must not satisfy VIDEO_MEETINGS. */
export function callsPermissionGrantsVideoMeetings(permissions: PermissionMap): boolean {
  const hasCalls =
    scopeOf(permissions, CALLS_VIEW_PERMISSION) != null ||
    scopeOf(permissions, CALLS_PLAY_PERMISSION) != null ||
    Object.keys(permissions).some((key) => key.startsWith(`${CALLS_MODULE}_`));
  if (!hasCalls) return false;
  return hasVideoMeetingsPermission(permissions, 'VIEW');
}

/**
 * Entity links are navigation only — they never widen media / meeting ACL.
 */
export function entityLinkGrantsVideoMeetingsAccess(
  _links: readonly VideoMeetingEntityLinkRef[],
  permissions: PermissionMap,
): boolean {
  void _links;
  return hasVideoMeetingsPermission(permissions, 'VIEW');
}

export function isVideoMeetingsViewDenied(permissions: PermissionMap): boolean {
  return !hasVideoMeetingsPermission(permissions, 'VIEW');
}

/** Runtime key used in permission maps (module_action). */
export const VIDEO_MEETINGS_VIEW_KEY = VIDEO_MEETINGS_VIEW;
