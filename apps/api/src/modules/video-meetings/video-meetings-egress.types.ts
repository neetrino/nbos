/** Published audio track currently in a LiveKit room. */
export type VideoMeetingPublishedAudioTrack = {
  participantId: string;
  trackId: string;
};

export type VideoMeetingsEgressStartResult = {
  egressId: string;
};

/**
 * Egress orchestration port — LiveKit SDK in prod, fake in unit tests.
 * Boot must succeed when the real client is not configured.
 */
export interface VideoMeetingsEgressClient {
  isConfigured(): boolean;
  listPublishedAudioTracks(roomName: string): Promise<VideoMeetingPublishedAudioTrack[]>;
  listParticipantIdentities(roomName: string): Promise<string[]>;
  startRoomComposite(roomName: string, objectKey: string): Promise<VideoMeetingsEgressStartResult>;
  startTrackAudio(
    roomName: string,
    trackId: string,
    objectKey: string,
  ): Promise<VideoMeetingsEgressStartResult>;
  stopEgress(egressId: string): Promise<void>;
}

export type VideoMeetingsRecordingS3Config = {
  accessKey: string;
  secret: string;
  bucket: string;
  endpoint: string;
  region: string;
  forcePathStyle: boolean;
};

export type VideoMeetingObjectHeadResult = {
  exists: boolean;
  sizeBytes: number;
};

/** Private object store for intended keys + HeadObject verification (no FileAsset writes). */
export interface VideoMeetingsRecordingObjectStore {
  isConfigured(): boolean;
  getS3Config(): VideoMeetingsRecordingS3Config;
  headObject(objectKey: string): Promise<VideoMeetingObjectHeadResult>;
}
