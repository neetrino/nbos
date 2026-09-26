import { randomBytes } from 'node:crypto';
import {
  VIDEO_MEETING_ROOM_NAME_PREFIX,
  VIDEO_MEETING_ROOM_NAME_RANDOM_BYTES,
} from './video-meetings.constants';

/** Opaque LiveKit room-name placeholder — stored only; S02 does not call LiveKit. */
export function generateOpaqueLivekitRoomName(): string {
  const suffix = randomBytes(VIDEO_MEETING_ROOM_NAME_RANDOM_BYTES).toString('base64url');
  return `${VIDEO_MEETING_ROOM_NAME_PREFIX}${suffix}`;
}
