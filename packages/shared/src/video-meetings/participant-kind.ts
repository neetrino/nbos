export const VIDEO_MEETING_TOKEN_KIND_EMPLOYEE = 'EMPLOYEE' as const;
export const VIDEO_MEETING_TOKEN_KIND_GUEST = 'GUEST' as const;

export type VideoMeetingTokenKind =
  | typeof VIDEO_MEETING_TOKEN_KIND_EMPLOYEE
  | typeof VIDEO_MEETING_TOKEN_KIND_GUEST;

/** LiveKit participant metadata so the call UI can tell teammates from guests. */
export function videoMeetingTokenMetadata(kind: VideoMeetingTokenKind): string {
  return JSON.stringify({ kind });
}

export function readVideoMeetingTokenKind(
  metadata: string | undefined,
): VideoMeetingTokenKind | null {
  if (!metadata) return null;
  try {
    const parsed = JSON.parse(metadata) as { kind?: unknown };
    if (parsed.kind === VIDEO_MEETING_TOKEN_KIND_EMPLOYEE) return VIDEO_MEETING_TOKEN_KIND_EMPLOYEE;
    if (parsed.kind === VIDEO_MEETING_TOKEN_KIND_GUEST) return VIDEO_MEETING_TOKEN_KIND_GUEST;
    return null;
  } catch {
    return null;
  }
}
