import { VideoPresets, type RoomOptions } from 'livekit-client';

/** 1080p capture with simulcast so weaker clients still receive a lower layer. */
export const VIDEO_MEETING_ROOM_OPTIONS: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
  audioCaptureDefaults: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  videoCaptureDefaults: {
    resolution: VideoPresets.h1080.resolution,
  },
  publishDefaults: {
    simulcast: true,
    videoEncoding: VideoPresets.h1080.encoding,
    videoSimulcastLayers: [VideoPresets.h360, VideoPresets.h720],
  },
};
