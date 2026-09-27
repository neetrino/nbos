import { describe, expect, it } from 'vitest';
import {
  VideoMeetingRecordingAssetKind,
  VideoMeetingRecordingAssetStatus,
  VideoMeetingRecordingStatus,
} from '@nbos/database';
import { assertSafeGuestPayload } from './video-meetings-guest-safety';
import { assertSafeVideoMeetingPayload } from './video-meetings.serializer';
import {
  buildGuestThread,
  buildVideoMeetingThread,
  type ThreadRows,
} from './video-meetings-thread.serializer';

const at = (hhmm: string) => new Date(`2026-09-27T${hhmm}:00.000Z`);

function composite(status: VideoMeetingRecordingAssetStatus, fileAssetId: string | null) {
  return { kind: VideoMeetingRecordingAssetKind.ROOM_COMPOSITE, status, fileAssetId };
}

function rows(): ThreadRows {
  return {
    sessions: [
      { id: 's1', startedAt: at('10:00'), endedAt: at('10:30'), createdAt: at('10:00') },
      { id: 's2', startedAt: at('12:00'), endedAt: null, createdAt: at('12:00') },
    ],
    messages: [
      {
        id: 'm-guest',
        sessionId: 's1',
        authorParticipantId: 'p-guest',
        employeeId: null,
        authorDisplayName: 'Guest',
        body: 'in call',
        createdAt: at('10:10'),
      },
      {
        id: 'm-after',
        sessionId: null,
        authorParticipantId: null,
        employeeId: 'emp-1',
        authorDisplayName: 'Ann',
        body: 'after call',
        createdAt: at('11:00'),
      },
    ],
    recordings: [
      {
        id: 'r-open-at-end',
        sessionId: 's1',
        status: VideoMeetingRecordingStatus.READY,
        startedAt: at('10:05'),
        stoppedAt: null,
        createdAt: at('10:05'),
        assets: [composite(VideoMeetingRecordingAssetStatus.READY, 'file-1')],
      },
      {
        id: 'r-processing',
        sessionId: 's2',
        status: VideoMeetingRecordingStatus.FINALIZING,
        startedAt: at('12:05'),
        stoppedAt: at('12:20'),
        createdAt: at('12:05'),
        assets: [composite(VideoMeetingRecordingAssetStatus.PENDING, null)],
      },
    ],
  };
}

describe('video meeting thread serializer', () => {
  it('merges sessions, messages and recording cards oldest first', () => {
    const thread = buildVideoMeetingThread('meeting-1', rows(), true);

    expect(thread.items.map((item) => `${item.type}:${item.id}`)).toEqual([
      'session:s1',
      'message:m-guest',
      'recording:r-open-at-end',
      'message:m-after',
      'session:s2',
      'recording:r-processing',
    ]);
    const card = thread.items.find((item) => item.id === 'r-open-at-end');
    expect(card).toMatchObject({ at: at('10:30').toISOString(), playable: true });
    expect(thread.items.find((item) => item.id === 'r-processing')).toMatchObject({
      status: 'FINALIZING',
      playable: false,
    });
    assertSafeVideoMeetingPayload(thread);
  });

  it('never marks a card playable when the caller may not play', () => {
    const thread = buildVideoMeetingThread('meeting-1', rows(), false);
    expect(thread.items.some((item) => item.type === 'recording' && item.playable)).toBe(false);
  });

  it('guest thread has messages and non-playable notes only', () => {
    const thread = buildGuestThread(rows());
    const json = JSON.stringify(thread);

    expect(thread.items.map((item) => item.type)).toEqual([
      'message',
      'recording_note',
      'message',
      'recording_note',
    ]);
    for (const key of ['playable', 'employeeId', 'entityLinks', 'fileAssetId', 'playbackUrl']) {
      expect(json).not.toContain(`"${key}"`);
    }
    expect(json).not.toContain('"session"');
    assertSafeGuestPayload(thread);
  });
});
