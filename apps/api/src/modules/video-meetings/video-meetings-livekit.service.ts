import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken, RoomServiceClient, type VideoGrant } from 'livekit-server-sdk';
import {
  LIVEKIT_API_KEY_ENV_KEY,
  LIVEKIT_API_SECRET_ENV_KEY,
  LIVEKIT_PUBLIC_URL_ENV_KEY,
  LIVEKIT_URL_ENV_KEY,
  VIDEO_MEETING_LIVEKIT_EMPTY_TIMEOUT_SECONDS,
  VIDEO_MEETING_LIVEKIT_TOKEN_TTL_SECONDS,
} from './video-meetings.constants';
import {
  assertLeastPrivilegeVideoGrant,
  assertRequestedRoomMatchesSession,
  buildVideoMeetingVideoGrant,
  type VideoMeetingTokenRole,
} from './video-meetings-token-grants';

export type LiveKitJoinCredentials = {
  livekitUrl: string;
  token: string;
  roomName: string;
};

type LiveKitEnv = {
  serverUrl: string;
  publicUrl: string;
  apiKey: string;
  apiSecret: string;
};

/**
 * Lazy LiveKit wiring: module boot succeeds without LiveKit env.
 * Token/room calls throw 503 when credentials are missing.
 */
@Injectable()
export class VideoMeetingsLivekitService {
  private roomClient: RoomServiceClient | null = null;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return this.readEnv() != null;
  }

  /** Create or ensure a LiveKit room for the opaque session room name. */
  async ensureRoom(roomName: string): Promise<void> {
    const client = this.getRoomClient();
    await client.createRoom({
      name: roomName,
      emptyTimeout: VIDEO_MEETING_LIVEKIT_EMPTY_TIMEOUT_SECONDS,
    });
  }

  async mintJoinToken(input: {
    roomName: string;
    participantId: string;
    displayName: string;
    role: VideoMeetingTokenRole;
    requestedRoomName?: string;
  }): Promise<LiveKitJoinCredentials> {
    const env = this.requireEnv();
    try {
      assertRequestedRoomMatchesSession(input.requestedRoomName, input.roomName);
    } catch {
      throw new BadRequestException('Requested room name does not match the meeting session');
    }
    const grant = buildVideoMeetingVideoGrant(input.roomName, input.role);
    assertLeastPrivilegeVideoGrant(grant, input.roomName);
    const token = await this.signToken({
      apiKey: env.apiKey,
      apiSecret: env.apiSecret,
      identity: input.participantId,
      name: input.displayName,
      grant,
    });
    return {
      livekitUrl: env.publicUrl,
      token,
      roomName: input.roomName,
    };
  }

  /** Test/hook seam: sign without network. */
  async signToken(input: {
    apiKey: string;
    apiSecret: string;
    identity: string;
    name: string;
    grant: VideoGrant;
  }): Promise<string> {
    assertLeastPrivilegeVideoGrant(input.grant, input.grant.room ?? '');
    const at = new AccessToken(input.apiKey, input.apiSecret, {
      identity: input.identity,
      name: input.name,
      ttl: VIDEO_MEETING_LIVEKIT_TOKEN_TTL_SECONDS,
    });
    at.addGrant(input.grant);
    return at.toJwt();
  }

  private getRoomClient(): RoomServiceClient {
    if (this.roomClient) return this.roomClient;
    const env = this.requireEnv();
    this.roomClient = new RoomServiceClient(env.serverUrl, env.apiKey, env.apiSecret);
    return this.roomClient;
  }

  private requireEnv(): LiveKitEnv {
    const env = this.readEnv();
    if (!env) {
      throw new ServiceUnavailableException('LiveKit is not configured');
    }
    return env;
  }

  private readEnv(): LiveKitEnv | null {
    const serverUrl = this.config.get<string>(LIVEKIT_URL_ENV_KEY)?.trim();
    const apiKey = this.config.get<string>(LIVEKIT_API_KEY_ENV_KEY)?.trim();
    const apiSecret = this.config.get<string>(LIVEKIT_API_SECRET_ENV_KEY)?.trim();
    if (!serverUrl || !apiKey || !apiSecret) return null;
    const publicUrl =
      this.config.get<string>(LIVEKIT_PUBLIC_URL_ENV_KEY)?.trim() ||
      serverUrl.replace(/^http/i, 'ws');
    return { serverUrl, publicUrl, apiKey, apiSecret };
  }
}
