'use client';

import { useParticipants, useRoomContext } from '@livekit/components-react';
import { readVideoMeetingTokenKind, VIDEO_MEETING_TOKEN_KIND_EMPLOYEE } from '@nbos/shared';

/** True when no other employee is connected. Guests do not count. */
export function useIsLastTeammate(): boolean {
  const room = useRoomContext();
  const participants = useParticipants();
  const localId = room.localParticipant.identity;
  const otherTeammate = participants.some(
    (participant) =>
      participant.identity !== localId &&
      readVideoMeetingTokenKind(participant.metadata) === VIDEO_MEETING_TOKEN_KIND_EMPLOYEE,
  );
  return !otherTeammate;
}
