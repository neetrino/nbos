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
