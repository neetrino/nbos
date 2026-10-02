import { api } from '../api';

export type VideoMeetingRecordingPlayback = {
  assetId: string;
  kind: 'ROOM_COMPOSITE';
  url: string;
  mimeType: string;
  expiresInSeconds: number;
};

/** Signed ROOM_COMPOSITE playback for one recording group (employees only). */
export const videoMeetingRecordingPlaybackApi = {
  getForRecording: async (
    meetingId: string,
    recordingId: string,
  ): Promise<VideoMeetingRecordingPlayback> => {
    const resp = await api.get<VideoMeetingRecordingPlayback>(
      `/api/video-meetings/${meetingId}/recordings/${recordingId}/playback`,
    );
    return resp.data;
  },
};
