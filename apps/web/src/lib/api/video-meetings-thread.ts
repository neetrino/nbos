import { api } from '../api';
import type {
  VideoMeetingEntityLinkType,
  VideoMeetingListItem,
  VideoMeetingRecordingStatus,
} from './video-meetings';

export type VideoMeetingThreadMessage = {
  type: 'message';
  at: string;
  id: string;
  sessionId: string | null;
  authorParticipantId: string | null;
  employeeId: string | null;
  authorDisplayName: string;
  body: string;
  createdAt: string;
};

export type VideoMeetingThreadSession = {
  type: 'session';
  at: string;
  id: string;
  startedAt: string | null;
  endedAt: string | null;
};

/** No playback URL here; `playable` means the private player may be offered on this card. */
export type VideoMeetingThreadRecording = {
  type: 'recording';
  at: string;
  id: string;
  sessionId: string | null;
  status: VideoMeetingRecordingStatus;
  playable: boolean;
};

export type VideoMeetingThreadItem =
  | VideoMeetingThreadMessage
  | VideoMeetingThreadSession
  | VideoMeetingThreadRecording;

/** Chronological, oldest first. */
export type VideoMeetingThread = { meetingId: string; items: VideoMeetingThreadItem[] };

export const videoMeetingThreadApi = {
  getThread: async (meetingId: string): Promise<VideoMeetingThread> => {
    const resp = await api.get<VideoMeetingThread>(`/api/video-meetings/${meetingId}/thread`);
    return resp.data;
  },

  postMessage: async (meetingId: string, body: string): Promise<VideoMeetingThreadMessage> => {
    const resp = await api.post<VideoMeetingThreadMessage>(
      `/api/video-meetings/${meetingId}/messages`,
      { body },
    );
    return resp.data;
  },

  /** Latest non-cancelled room linked to the record and visible to the caller, or null. */
  getByEntity: async (
    entityType: VideoMeetingEntityLinkType,
    entityId: string,
  ): Promise<VideoMeetingListItem | null> => {
    const resp = await api.get<VideoMeetingListItem | null>('/api/video-meetings/by-entity', {
      params: { entityType, entityId },
    });
    return resp.data ?? null;
  },
};
