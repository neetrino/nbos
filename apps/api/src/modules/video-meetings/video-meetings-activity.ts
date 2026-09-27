type ActivitySession = { startedAt: Date | null; endedAt: Date | null };

type ActivityMeeting = {
  updatedAt: Date;
  sessions?: readonly ActivitySession[];
  messages?: readonly { createdAt: Date }[];
};

function maxTime(dates: readonly (Date | null | undefined)[]): Date | null {
  let latest: Date | null = null;
  for (const date of dates) {
    if (date && (!latest || date.getTime() > latest.getTime())) latest = date;
  }
  return latest;
}

/** Latest session start/end, or null when the room was never held. */
export function latestSessionActivityAt(sessions: readonly ActivitySession[]): Date | null {
  return maxTime(sessions.flatMap((session) => [session.startedAt, session.endedAt]));
}

/** Most recently active: latest session bound, else meeting `updatedAt` (by-entity ranking). */
export function videoMeetingSessionActivityAt(meeting: ActivityMeeting): Date {
  return latestSessionActivityAt(meeting.sessions ?? []) ?? meeting.updatedAt;
}

/** List `lastActivityAt`: max of session bounds, message times and meeting `updatedAt`. */
export function videoMeetingLastActivityAt(meeting: ActivityMeeting): Date {
  const candidates = [
    latestSessionActivityAt(meeting.sessions ?? []),
    ...(meeting.messages ?? []).map((message) => message.createdAt),
    meeting.updatedAt,
  ];
  return maxTime(candidates) ?? meeting.updatedAt;
}
