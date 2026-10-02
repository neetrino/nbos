import {
  VIDEO_MEETING_LEGACY_DEFAULT_TITLE,
  VIDEO_MEETING_STORED_DEFAULT_TITLE,
} from './constants';

/** Next unused "Meeting N" title. A custom duplicate is still allowed on submit. */
export function suggestNextVideoMeetingTitle(titles: readonly string[], prefix: string): string {
  const pattern = new RegExp(`^${escapeRegExp(prefix)}\\s+(\\d+)$`, 'i');
  const used = new Set<number>();
  for (const title of titles) {
    const match = title.trim().match(pattern);
    const sequence = match?.[1] ? Number(match[1]) : Number.NaN;
    if (Number.isInteger(sequence) && sequence > 0) used.add(sequence);
  }
  let sequence = 1;
  while (used.has(sequence)) sequence += 1;
  return `${prefix} ${sequence}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
