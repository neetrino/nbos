import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DirectFileOutput,
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  RoomServiceClient,
  S3Upload,
  TrackType,
} from 'livekit-server-sdk';
import {
  LIVEKIT_API_KEY_ENV_KEY,
  LIVEKIT_API_SECRET_ENV_KEY,
  LIVEKIT_URL_ENV_KEY,
} from './video-meetings.constants';
import { VIDEO_MEETINGS_RECORDING_OBJECT_STORE_TOKEN } from './video-meetings-recording.constants';
import type {
  VideoMeetingPublishedAudioTrack,
  VideoMeetingsEgressClient,
  VideoMeetingsEgressStartResult,
  VideoMeetingsRecordingObjectStore,
} from './video-meetings-egress.types';

type LiveKitCreds = { serverUrl: string; apiKey: string; apiSecret: string };

/**
 * LiveKit EgressClient + RoomService listing. Lazy: missing env → not configured (no boot crash).
 */
@Injectable()
export class VideoMeetingsLivekitEgressClient implements VideoMeetingsEgressClient {
  private readonly logger = new Logger(VideoMeetingsLivekitEgressClient.name);
  private egress: EgressClient | null = null;
  private rooms: RoomServiceClient | null = null;

  constructor(
    private readonly config: ConfigService,
    @Optional()
    @Inject(VIDEO_MEETINGS_RECORDING_OBJECT_STORE_TOKEN)
    private readonly objectStore: VideoMeetingsRecordingObjectStore | null,
  ) {}

  isConfigured(): boolean {
    return this.readCreds() != null && this.objectStore?.isConfigured() === true;
  }

  async listPublishedAudioTracks(roomName: string): Promise<VideoMeetingPublishedAudioTrack[]> {
    const rooms = this.getRooms();
    const participants = await rooms.listParticipants(roomName);
    const tracks: VideoMeetingPublishedAudioTrack[] = [];
    for (const participant of participants) {
      for (const track of participant.tracks) {
        if (track.type === TrackType.AUDIO && track.sid) {
          tracks.push({ participantId: participant.identity, trackId: track.sid });
        }
      }
    }
    return tracks;
  }

  async listParticipantIdentities(roomName: string): Promise<string[]> {
    const rooms = this.getRooms();
    const participants = await rooms.listParticipants(roomName);
    return participants.map((p) => p.identity).filter((id) => id.length > 0);
  }

  async startRoomComposite(
    roomName: string,
    objectKey: string,
  ): Promise<VideoMeetingsEgressStartResult> {
    const egress = this.getEgress();
    const output = new EncodedFileOutput({
      fileType: EncodedFileType.MP4,
      filepath: objectKey,
      output: { case: 's3', value: this.buildS3Upload() },
    });
    const info = await egress.startRoomCompositeEgress(roomName, output);
    return { egressId: info.egressId };
  }

  async startTrackAudio(
    roomName: string,
    trackId: string,
    objectKey: string,
  ): Promise<VideoMeetingsEgressStartResult> {
    const egress = this.getEgress();
    const output = new DirectFileOutput({
      filepath: objectKey,
      output: { case: 's3', value: this.buildS3Upload() },
    });
    const info = await egress.startTrackEgress(roomName, output, trackId);
    return { egressId: info.egressId };
  }

  async stopEgress(egressId: string): Promise<void> {
    try {
      await this.getEgress().stopEgress(egressId);
    } catch (error) {
      this.logger.warn(`stopEgress ${egressId} failed: ${String(error)}`);
    }
  }

  private buildS3Upload(): S3Upload {
    const store = this.objectStore;
    if (!store?.isConfigured()) {
      throw new Error('Recording object store is not configured');
    }
    const cfg = store.getS3Config();
    return new S3Upload({
      accessKey: cfg.accessKey,
      secret: cfg.secret,
      bucket: cfg.bucket,
      endpoint: cfg.endpoint,
      region: cfg.region,
      forcePathStyle: cfg.forcePathStyle,
    });
  }

  private getEgress(): EgressClient {
    if (this.egress) return this.egress;
    const creds = this.requireCreds();
    this.egress = new EgressClient(creds.serverUrl, creds.apiKey, creds.apiSecret);
    return this.egress;
  }

  private getRooms(): RoomServiceClient {
    if (this.rooms) return this.rooms;
    const creds = this.requireCreds();
    this.rooms = new RoomServiceClient(creds.serverUrl, creds.apiKey, creds.apiSecret);
    return this.rooms;
  }

  private requireCreds(): LiveKitCreds {
    const creds = this.readCreds();
    if (!creds) {
      throw new Error('LiveKit is not configured');
    }
    return creds;
  }

  private readCreds(): LiveKitCreds | null {
    const serverUrl = this.config.get<string>(LIVEKIT_URL_ENV_KEY)?.trim();
    const apiKey = this.config.get<string>(LIVEKIT_API_KEY_ENV_KEY)?.trim();
    const apiSecret = this.config.get<string>(LIVEKIT_API_SECRET_ENV_KEY)?.trim();
    if (!serverUrl || !apiKey || !apiSecret) return null;
    return { serverUrl, apiKey, apiSecret };
  }
}
