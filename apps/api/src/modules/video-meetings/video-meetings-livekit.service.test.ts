import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TrackSource } from 'livekit-server-sdk';
import { VideoMeetingsLivekitService } from './video-meetings-livekit.service';
import {
  LIVEKIT_API_KEY_ENV_KEY,
  LIVEKIT_API_SECRET_ENV_KEY,
  LIVEKIT_PUBLIC_URL_ENV_KEY,
  LIVEKIT_URL_ENV_KEY,
} from './video-meetings.constants';

function configWith(values: Record<string, string | undefined>): ConfigService {
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

describe('VideoMeetingsLivekitService', () => {
  it('boots without LiveKit env and reports not configured', () => {
    const service = new VideoMeetingsLivekitService(configWith({}));
    expect(service.isConfigured()).toBe(false);
  });

  it('returns 503 semantics when minting without config', async () => {
    const service = new VideoMeetingsLivekitService(configWith({}));
    await expect(
      service.mintJoinToken({
        roomName: 'vm_x',
        participantId: 'p1',
        displayName: 'Host',
        role: 'host',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('mints a JWT scoped to one room without privileged claims', async () => {
    const service = new VideoMeetingsLivekitService(
      configWith({
        [LIVEKIT_URL_ENV_KEY]: 'http://127.0.0.1:7880',
        [LIVEKIT_PUBLIC_URL_ENV_KEY]: 'ws://127.0.0.1:7880',
        [LIVEKIT_API_KEY_ENV_KEY]: 'devkey',
        [LIVEKIT_API_SECRET_ENV_KEY]: 'secret',
      }),
    );
    const createRoom = vi.fn().mockResolvedValue({ name: 'vm_room' });
    (
      service as unknown as { getRoomClient: () => { createRoom: typeof createRoom } }
    ).getRoomClient = () => ({ createRoom });

    const result = await service.mintJoinToken({
      roomName: 'vm_room',
      participantId: 'participant-opaque',
      displayName: 'Ada',
      role: 'host',
    });
    expect(result.roomName).toBe('vm_room');
    expect(result.livekitUrl).toBe('ws://127.0.0.1:7880');
    expect(typeof result.token).toBe('string');
    expect(result.token.split('.')).toHaveLength(3);

    const payload = JSON.parse(
      Buffer.from(result.token.split('.')[1]!, 'base64url').toString('utf8'),
    ) as {
      video?: Record<string, unknown>;
      sub?: string;
    };
    expect(payload.sub).toBe('participant-opaque');
    expect(payload.video?.room).toBe('vm_room');
    expect(payload.video?.roomJoin).toBe(true);
    expect(payload.video?.roomCreate).toBeUndefined();
    expect(payload.video?.roomAdmin).toBeUndefined();
    expect(payload.video?.roomRecord).toBeUndefined();
    expect(payload.video?.recorder).toBeUndefined();
  });

  it('rejects wrong requested room name', async () => {
    const service = new VideoMeetingsLivekitService(
      configWith({
        [LIVEKIT_URL_ENV_KEY]: 'http://127.0.0.1:7880',
        [LIVEKIT_API_KEY_ENV_KEY]: 'devkey',
        [LIVEKIT_API_SECRET_ENV_KEY]: 'secret',
      }),
    );
    await expect(
      service.mintJoinToken({
        roomName: 'vm_room',
        participantId: 'p1',
        displayName: 'Ada',
        role: 'guest',
        requestedRoomName: 'other',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('guest grant omits screen share sources vs host', async () => {
    const service = new VideoMeetingsLivekitService(
      configWith({
        [LIVEKIT_URL_ENV_KEY]: 'http://127.0.0.1:7880',
        [LIVEKIT_API_KEY_ENV_KEY]: 'devkey',
        [LIVEKIT_API_SECRET_ENV_KEY]: 'secret',
      }),
    );
    const host = await service.mintJoinToken({
      roomName: 'vm_room',
      participantId: 'host-1',
      displayName: 'Host',
      role: 'host',
    });
    const guest = await service.mintJoinToken({
      roomName: 'vm_room',
      participantId: 'guest-1',
      displayName: 'Guest',
      role: 'guest',
    });
    const hostVideo = JSON.parse(
      Buffer.from(host.token.split('.')[1]!, 'base64url').toString('utf8'),
    ).video as { canPublishSources?: string[] };
    const guestVideo = JSON.parse(
      Buffer.from(guest.token.split('.')[1]!, 'base64url').toString('utf8'),
    ).video as { canPublishSources?: string[] };
    expect(hostVideo.canPublishSources).toContain('screen_share');
    expect(guestVideo.canPublishSources).not.toContain('screen_share');
    expect(guestVideo.canPublishSources).toEqual(expect.arrayContaining(['camera', 'microphone']));
    void TrackSource;
  });
});

describe('VideoMeetingsLivekitService ensureRoom', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls RoomServiceClient.createRoom when configured', async () => {
    const service = new VideoMeetingsLivekitService(
      configWith({
        [LIVEKIT_URL_ENV_KEY]: 'http://127.0.0.1:7880',
        [LIVEKIT_API_KEY_ENV_KEY]: 'devkey',
        [LIVEKIT_API_SECRET_ENV_KEY]: 'secret',
      }),
    );
    const createRoom = vi.fn().mockResolvedValue({ name: 'vm_x' });
    (
      service as unknown as {
        getRoomClient: () => { createRoom: typeof createRoom };
      }
    ).getRoomClient = () => ({ createRoom });
    await service.ensureRoom('vm_x');
    expect(createRoom).toHaveBeenCalledWith(expect.objectContaining({ name: 'vm_x' }));
  });
});
