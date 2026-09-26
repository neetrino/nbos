import {
  VIDEO_MEETING_LEGACY_DEFAULT_TITLE,
  VIDEO_MEETING_STORED_DEFAULT_TITLE,
} from './constants';

/** Map stored default / legacy English titles to the localized UI label. */
export function resolveVideoMeetingDisplayTitle(
  storedTitle: string,
  localizedDefault: string,
): string {
  const trimmed = storedTitle.trim();
  if (
    trimmed === VIDEO_MEETING_LEGACY_DEFAULT_TITLE ||
    trimmed === VIDEO_MEETING_STORED_DEFAULT_TITLE
  ) {
    return localizedDefault;
  }
  return trimmed || localizedDefault;
}

/** Build an absolute guest join URL from a one-time invite secret. */
export function buildGuestInviteJoinUrl(token: string, origin?: string): string {
  const path = `/video-meetings/join?invite=${encodeURIComponent(token)}`;
  if (origin && origin.trim()) {
    return `${origin.replace(/\/$/, '')}${path}`;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return path;
}
