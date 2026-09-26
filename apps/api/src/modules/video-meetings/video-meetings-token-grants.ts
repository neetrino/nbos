import type { VideoGrant } from 'livekit-server-sdk';
import { TrackSource } from 'livekit-server-sdk';

export type VideoMeetingTokenRole = 'host' | 'guest';

/**
 * Least-privilege LiveKit video grant for a single room.
 * Never sets roomCreate, roomAdmin, roomRecord, recorder, or ingressAdmin.
 */
export function buildVideoMeetingVideoGrant(
  roomName: string,
  role: VideoMeetingTokenRole,
): VideoGrant {
  const sources =
    role === 'host'
      ? [
          TrackSource.CAMERA,
          TrackSource.MICROPHONE,
          TrackSource.SCREEN_SHARE,
          TrackSource.SCREEN_SHARE_AUDIO,
        ]
      : [TrackSource.CAMERA, TrackSource.MICROPHONE];

  return {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    canPublishSources: sources,
  };
}

/** Assert grant is single-room and lacks privileged LiveKit capabilities. */
export function assertLeastPrivilegeVideoGrant(grant: VideoGrant, expectedRoom: string): void {
  if (grant.room !== expectedRoom) {
    throw new Error(`Video grant room mismatch: expected ${expectedRoom}`);
  }
  if (grant.roomCreate === true) {
    throw new Error('Video grant must not include roomCreate');
  }
  if (grant.roomAdmin === true) {
    throw new Error('Video grant must not include roomAdmin');
  }
  if (grant.roomRecord === true) {
    throw new Error('Video grant must not include roomRecord');
  }
  if (grant.recorder === true) {
    throw new Error('Video grant must not include recorder');
  }
  if (grant.ingressAdmin === true) {
    throw new Error('Video grant must not include ingressAdmin');
  }
  if (grant.roomList === true) {
    throw new Error('Video grant must not include roomList');
  }
  if (!grant.roomJoin) {
    throw new Error('Video grant must include roomJoin');
  }
}

/** Reject client-supplied room names that do not match the meeting session. */
export function assertRequestedRoomMatchesSession(
  requestedRoomName: string | undefined,
  sessionRoomName: string,
): void {
  if (requestedRoomName != null && requestedRoomName !== sessionRoomName) {
    throw new Error('Requested room name does not match the meeting session');
  }
}
