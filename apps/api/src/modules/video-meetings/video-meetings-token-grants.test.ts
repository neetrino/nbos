import { describe, expect, it } from 'vitest';
import { TrackSource } from 'livekit-server-sdk';
import {
  assertLeastPrivilegeVideoGrant,
  assertRequestedRoomMatchesSession,
  buildVideoMeetingVideoGrant,
} from './video-meetings-token-grants';

describe('video-meetings-token-grants', () => {
  it('builds single-room host grant without privileged capabilities', () => {
    const grant = buildVideoMeetingVideoGrant('vm_room_a', 'host');
    expect(grant.room).toBe('vm_room_a');
    expect(grant.roomJoin).toBe(true);
    expect(grant.roomCreate).toBeUndefined();
    expect(grant.roomAdmin).toBeUndefined();
    expect(grant.roomRecord).toBeUndefined();
    expect(grant.recorder).toBeUndefined();
    expect(grant.canPublishSources).toEqual([
      TrackSource.CAMERA,
      TrackSource.MICROPHONE,
      TrackSource.SCREEN_SHARE,
      TrackSource.SCREEN_SHARE_AUDIO,
    ]);
    expect(() => assertLeastPrivilegeVideoGrant(grant, 'vm_room_a')).not.toThrow();
  });

  it('builds guest grant with camera+microphone only (no screen share)', () => {
    const grant = buildVideoMeetingVideoGrant('vm_room_b', 'guest');
    expect(grant.canPublishSources).toEqual([TrackSource.CAMERA, TrackSource.MICROPHONE]);
    expect(grant.roomCreate).toBeUndefined();
    expect(grant.roomAdmin).toBeUndefined();
    expect(grant.recorder).toBeUndefined();
  });

  it('rejects wrong room name on assertion helpers', () => {
    const grant = buildVideoMeetingVideoGrant('vm_room_a', 'host');
    expect(() => assertLeastPrivilegeVideoGrant(grant, 'other_room')).toThrow(/room mismatch/);
    expect(() => assertRequestedRoomMatchesSession('wrong', 'vm_room_a')).toThrow(/does not match/);
  });

  it('rejects privileged flags if someone adds them', () => {
    const bad = { ...buildVideoMeetingVideoGrant('r', 'host'), roomAdmin: true };
    expect(() => assertLeastPrivilegeVideoGrant(bad, 'r')).toThrow(/roomAdmin/);
    const recorder = { ...buildVideoMeetingVideoGrant('r', 'host'), recorder: true };
    expect(() => assertLeastPrivilegeVideoGrant(recorder, 'r')).toThrow(/recorder/);
    const create = { ...buildVideoMeetingVideoGrant('r', 'host'), roomCreate: true };
    expect(() => assertLeastPrivilegeVideoGrant(create, 'r')).toThrow(/roomCreate/);
  });
});
