import { randomBytes } from 'node:crypto';
import { VIDEO_MEETING_RECORDING_OBJECT_PREFIX } from './video-meetings-recording.constants';

const SEGMENT_ID_BYTES = 8;

export function buildCompositeObjectKey(meetingId: string, recordingId: string): string {
  return `${VIDEO_MEETING_RECORDING_OBJECT_PREFIX}/${meetingId}/recordings/${recordingId}/composite.mp4`;
}

export function buildParticipantAudioObjectKey(
  meetingId: string,
  recordingId: string,
  participantId: string,
): string {
  const segmentId = randomBytes(SEGMENT_ID_BYTES).toString('hex');
  return `${VIDEO_MEETING_RECORDING_OBJECT_PREFIX}/${meetingId}/recordings/${recordingId}/audio/${participantId}/${segmentId}.ogg`;
}
