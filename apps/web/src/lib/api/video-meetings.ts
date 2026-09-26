import { api } from '../api';

export type VideoMeetingEntityLinkType = 'DEAL' | 'PROJECT' | 'PRODUCT' | 'CONTACT';

export type VideoMeetingStatus = 'CREATED' | 'WAITING' | 'ACTIVE' | 'ENDED' | 'CANCELLED';

export type VideoMeetingEntityLink = {
  id: string;
  entityType: string;
  entityId: string;
  createdAt: string;
};

export type VideoMeetingSession = {
  id: string;
  livekitRoomName: string;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
};

export type VideoMeetingListItem = {
  id: string;
  title: string;
  status: VideoMeetingStatus;
  hostEmployeeId: string;
  ownerEmployeeId: string;
  endedAt: string | null;
  createdAt: string;
  entityLinks: VideoMeetingEntityLink[];
};

export type VideoMeetingCard = VideoMeetingListItem & {
  scheduledStartsAt: string | null;
  scheduledEndsAt: string | null;
  cancelledAt: string | null;
  calendarMeetingId: string | null;
  updatedAt: string;
  sessions: VideoMeetingSession[];
  recordings?: VideoMeetingRecordingGroup[];
};

export type VideoMeetingRecordingStatus =
  | 'PENDING'
  | 'RECORDING'
  | 'FINALIZING'
  | 'READY'
  | 'PARTIAL'
  | 'FAILED';

export type VideoMeetingRecordingAsset = {
  id: string;
  kind: 'ROOM_COMPOSITE' | 'PARTICIPANT_AUDIO';
  status: 'PENDING' | 'READY' | 'FAILED' | 'MISSING';
  participantId: string | null;
  rangeStartsAt: string | null;
  rangeEndsAt: string | null;
};

export type VideoMeetingRecordingGroup = {
  id: string;
  status: VideoMeetingRecordingStatus;
  startedAt: string | null;
  stoppedAt: string | null;
  assets: VideoMeetingRecordingAsset[];
};

export type ConsentDecision = 'GRANTED' | 'DECLINED' | 'REVOKED';

export type ConsentResult = {
  participantId: string;
  noticeVersion: string;
  noticeCopy: string;
  decision: ConsentDecision | 'UNKNOWN';
  decidedAt: string | null;
};

export type PaginatedVideoMeetings = {
  items: VideoMeetingListItem[];
  meta: { page: number; pageSize: number; total: number };
};

export type CreateInviteResult = {
  id: string;
  meetingId: string;
  expiresAt: string;
  token: string;
  revokedAt: null;
};

export type InviteListItem = {
  id: string;
  meetingId: string;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
};

export type WaitingParticipant = {
  participantId: string;
  displayName: string;
  admissionStatus: 'WAITING';
  createdAt: string;
};

export type LiveKitJoinCredentials = {
  livekitUrl: string;
  token: string;
  roomName: string;
  participantId: string;
  displayName: string;
};

export type GuestPrejoinResult = {
  admissionState: 'WAITING' | 'ADMITTED' | 'REJECTED';
  participantId: string;
  displayName: string;
};

export type GuestJoinResult = LiveKitJoinCredentials & {
  admissionState: 'ADMITTED';
};

async function getList(path: string, status?: VideoMeetingStatus): Promise<PaginatedVideoMeetings> {
  const resp = await api.get<PaginatedVideoMeetings>(path, {
    params: status ? { status } : undefined,
  });
  return resp.data;
}

export const videoMeetingsApi = {
  create: async (title?: string): Promise<VideoMeetingCard> => {
    const resp = await api.post<VideoMeetingCard>('/api/video-meetings', title ? { title } : {});
    return resp.data;
  },

  list: (status?: VideoMeetingStatus) => getList('/api/video-meetings', status),

  history: () => getList('/api/video-meetings/history'),

  getCard: async (meetingId: string): Promise<VideoMeetingCard> => {
    const resp = await api.get<VideoMeetingCard>(`/api/video-meetings/${meetingId}`);
    return resp.data;
  },

  start: async (meetingId: string): Promise<VideoMeetingCard> => {
    const resp = await api.post<VideoMeetingCard>(`/api/video-meetings/${meetingId}/start`);
    return resp.data;
  },

  end: async (meetingId: string): Promise<VideoMeetingCard> => {
    const resp = await api.post<VideoMeetingCard>(`/api/video-meetings/${meetingId}/end`);
    return resp.data;
  },

  cancel: async (meetingId: string): Promise<VideoMeetingCard> => {
    const resp = await api.post<VideoMeetingCard>(`/api/video-meetings/${meetingId}/cancel`);
    return resp.data;
  },

  employeeToken: async (meetingId: string, roomName?: string): Promise<LiveKitJoinCredentials> => {
    const resp = await api.post<LiveKitJoinCredentials>(`/api/video-meetings/${meetingId}/token`, {
      roomName,
    });
    return resp.data;
  },

  createInvite: async (meetingId: string, expiresAt: string): Promise<CreateInviteResult> => {
    const resp = await api.post<CreateInviteResult>(`/api/video-meetings/${meetingId}/invites`, {
      expiresAt,
    });
    return resp.data;
  },

  listInvites: async (meetingId: string): Promise<InviteListItem[]> => {
    const resp = await api.get<InviteListItem[]>(`/api/video-meetings/${meetingId}/invites`);
    return resp.data;
  },

  revokeInvite: async (meetingId: string, inviteId: string): Promise<InviteListItem> => {
    const resp = await api.post<InviteListItem>(
      `/api/video-meetings/${meetingId}/invites/${inviteId}/revoke`,
    );
    return resp.data;
  },

  listWaiting: async (meetingId: string): Promise<WaitingParticipant[]> => {
    const resp = await api.get<WaitingParticipant[]>(`/api/video-meetings/${meetingId}/waiting`);
    return resp.data;
  },

  admit: async (meetingId: string, participantId: string) => {
    const resp = await api.post<{ participantId: string; admissionStatus: 'ADMITTED' }>(
      `/api/video-meetings/${meetingId}/participants/${participantId}/admit`,
    );
    return resp.data;
  },

  reject: async (meetingId: string, participantId: string) => {
    const resp = await api.post<{ participantId: string; admissionStatus: 'REJECTED' }>(
      `/api/video-meetings/${meetingId}/participants/${participantId}/reject`,
    );
    return resp.data;
  },

  attachEntityLink: async (
    meetingId: string,
    entityType: VideoMeetingEntityLinkType,
    entityId: string,
  ): Promise<VideoMeetingCard> => {
    const resp = await api.post<VideoMeetingCard>(`/api/video-meetings/${meetingId}/entity-links`, {
      entityType,
      entityId,
    });
    return resp.data;
  },

  detachEntityLink: async (meetingId: string, linkId: string): Promise<VideoMeetingCard> => {
    const resp = await api.delete<VideoMeetingCard>(
      `/api/video-meetings/${meetingId}/entity-links/${linkId}`,
    );
    return resp.data;
  },

  startRecording: async (meetingId: string): Promise<{ recording: VideoMeetingRecordingGroup }> => {
    const resp = await api.post<{ recording: VideoMeetingRecordingGroup }>(
      `/api/video-meetings/${meetingId}/recording/start`,
    );
    return resp.data;
  },

  stopRecording: async (meetingId: string): Promise<{ recording: VideoMeetingRecordingGroup }> => {
    const resp = await api.post<{ recording: VideoMeetingRecordingGroup }>(
      `/api/video-meetings/${meetingId}/recording/stop`,
    );
    return resp.data;
  },

  getRecording: async (
    meetingId: string,
  ): Promise<{ recording: VideoMeetingRecordingGroup | null }> => {
    const resp = await api.get<{ recording: VideoMeetingRecordingGroup | null }>(
      `/api/video-meetings/${meetingId}/recording`,
    );
    return resp.data;
  },

  decideConsent: async (meetingId: string, decision: ConsentDecision): Promise<ConsentResult> => {
    const resp = await api.post<ConsentResult>(`/api/video-meetings/${meetingId}/consent`, {
      decision,
    });
    return resp.data;
  },
};

export async function guestPrejoin(
  inviteToken: string,
  displayName: string,
): Promise<GuestPrejoinResult> {
  const resp = await fetch('/api/bff/video-meetings/guest/prejoin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteToken, displayName }),
  });
  if (!resp.ok) {
    throw new Error(`Guest prejoin failed (${resp.status})`);
  }
  const body = (await resp.json()) as { data?: GuestPrejoinResult } | GuestPrejoinResult;
  return 'data' in body && body.data ? body.data : (body as GuestPrejoinResult);
}

export async function guestToken(inviteToken: string, roomName?: string): Promise<GuestJoinResult> {
  const resp = await fetch('/api/bff/video-meetings/guest/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteToken, roomName }),
  });
  if (!resp.ok) {
    throw new Error(`Guest token failed (${resp.status})`);
  }
  const body = (await resp.json()) as { data?: GuestJoinResult } | GuestJoinResult;
  return 'data' in body && body.data ? body.data : (body as GuestJoinResult);
}

export async function guestDecideConsent(
  inviteToken: string,
  decision: ConsentDecision,
): Promise<ConsentResult> {
  const resp = await fetch('/api/bff/video-meetings/guest/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteToken, decision }),
  });
  if (!resp.ok) {
    throw new Error(`Guest consent failed (${resp.status})`);
  }
  const body = (await resp.json()) as { data?: ConsentResult } | ConsentResult;
  return 'data' in body && body.data ? body.data : (body as ConsentResult);
}

export async function guestRecordingStatus(
  inviteToken: string,
): Promise<{ status: VideoMeetingRecordingStatus | 'NONE' }> {
  const resp = await fetch('/api/bff/video-meetings/guest/recording-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteToken }),
  });
  if (!resp.ok) {
    throw new Error(`Guest recording status failed (${resp.status})`);
  }
  const body = (await resp.json()) as
    | { data?: { status: VideoMeetingRecordingStatus | 'NONE' } }
    | { status: VideoMeetingRecordingStatus | 'NONE' };
  return 'data' in body && body.data
    ? body.data
    : (body as { status: VideoMeetingRecordingStatus | 'NONE' });
}
