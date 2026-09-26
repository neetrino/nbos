import type { VideoMeetingStatus } from '@nbos/database';
import { entityLinkGrantsVideoMeetingsAccess } from '@nbos/shared';
import {
  serializeRecordingGroup,
  type VideoMeetingRecordingGroupDto,
} from './video-meetings-recording.serializer';

type MeetingSessionRow = {
  id: string;
  livekitRoomName: string;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
};

type MeetingEntityLinkRow = {
  id: string;
  entityType: 'DEAL' | 'PROJECT' | 'PRODUCT' | 'CONTACT';
  entityId: string;
  createdAt: Date;
};

type MeetingRecordingRow = {
  id: string;
  status: VideoMeetingRecordingGroupDto['status'];
  startedAt: Date | null;
  stoppedAt: Date | null;
  assets: Array<{
    id: string;
    kind: 'ROOM_COMPOSITE' | 'PARTICIPANT_AUDIO';
    status: VideoMeetingRecordingGroupDto['assets'][number]['status'];
    participantId: string | null;
    rangeStartsAt: Date | null;
    rangeEndsAt: Date | null;
    objectKey?: string | null;
    egressId?: string | null;
    fileAssetId?: string | null;
  }>;
};

type MeetingRow = {
  id: string;
  title: string;
  status: VideoMeetingStatus;
  hostEmployeeId: string;
  ownerEmployeeId: string;
  scheduledStartsAt: Date | null;
  scheduledEndsAt: Date | null;
  endedAt: Date | null;
  cancelledAt: Date | null;
  calendarMeetingId: string | null;
  createdAt: Date;
  updatedAt: Date;
  sessions?: MeetingSessionRow[];
  entityLinks?: MeetingEntityLinkRow[];
  recordings?: MeetingRecordingRow[];
};

export type VideoMeetingCardDto = {
  id: string;
  title: string;
  status: VideoMeetingStatus;
  hostEmployeeId: string;
  ownerEmployeeId: string;
  scheduledStartsAt: string | null;
  scheduledEndsAt: string | null;
  endedAt: string | null;
  cancelledAt: string | null;
  calendarMeetingId: string | null;
  createdAt: string;
  updatedAt: string;
  sessions: VideoMeetingSessionDto[];
  entityLinks: VideoMeetingEntityLinkDto[];
  recordings: VideoMeetingRecordingGroupDto[];
};

export type VideoMeetingSessionDto = {
  id: string;
  livekitRoomName: string;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
};

export type VideoMeetingEntityLinkDto = {
  id: string;
  entityType: string;
  entityId: string;
  createdAt: string;
};

export type VideoMeetingListItemDto = {
  id: string;
  title: string;
  status: VideoMeetingStatus;
  hostEmployeeId: string;
  ownerEmployeeId: string;
  endedAt: string | null;
  createdAt: string;
  entityLinks: VideoMeetingEntityLinkDto[];
};

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function serializeEntityLink(link: MeetingEntityLinkRow): VideoMeetingEntityLinkDto {
  return {
    id: link.id,
    entityType: link.entityType,
    entityId: link.entityId,
    createdAt: link.createdAt.toISOString(),
  };
}

function serializeSession(session: MeetingSessionRow): VideoMeetingSessionDto {
  return {
    id: session.id,
    livekitRoomName: session.livekitRoomName,
    startedAt: toIso(session.startedAt),
    endedAt: toIso(session.endedAt),
    createdAt: session.createdAt.toISOString(),
  };
}

/**
 * Safe meeting card — never includes recording assets, R2 keys, invite digests, or playback URLs.
 * Entity links are navigation metadata only; they do not widen media ACL.
 */
export function serializeVideoMeetingCard(
  meeting: MeetingRow,
  callerPermissions: Readonly<Record<string, string>>,
): VideoMeetingCardDto {
  const links = meeting.entityLinks ?? [];
  void entityLinkGrantsVideoMeetingsAccess(
    links.map((link) => ({ entityType: link.entityType, entityId: link.entityId })),
    callerPermissions,
  );

  return {
    id: meeting.id,
    title: meeting.title,
    status: meeting.status,
    hostEmployeeId: meeting.hostEmployeeId,
    ownerEmployeeId: meeting.ownerEmployeeId,
    scheduledStartsAt: toIso(meeting.scheduledStartsAt),
    scheduledEndsAt: toIso(meeting.scheduledEndsAt),
    endedAt: toIso(meeting.endedAt),
    cancelledAt: toIso(meeting.cancelledAt),
    calendarMeetingId: meeting.calendarMeetingId,
    createdAt: meeting.createdAt.toISOString(),
    updatedAt: meeting.updatedAt.toISOString(),
    sessions: (meeting.sessions ?? []).map(serializeSession),
    entityLinks: links.map(serializeEntityLink),
    recordings: (meeting.recordings ?? []).map(serializeRecordingGroup),
  };
}

export function serializeVideoMeetingListItem(meeting: MeetingRow): VideoMeetingListItemDto {
  return {
    id: meeting.id,
    title: meeting.title,
    status: meeting.status,
    hostEmployeeId: meeting.hostEmployeeId,
    ownerEmployeeId: meeting.ownerEmployeeId,
    endedAt: toIso(meeting.endedAt),
    createdAt: meeting.createdAt.toISOString(),
    entityLinks: (meeting.entityLinks ?? []).map(serializeEntityLink),
  };
}

/** Assert response payload never carries recording / invite secrets (S02 contract). */
export function assertSafeVideoMeetingPayload(payload: unknown): void {
  const json = JSON.stringify(payload);
  const forbidden = [
    'playbackUrl',
    'playback_url',
    'tokenDigest',
    'token_digest',
    'inviteToken',
    'inviteSecret',
    'recordingUrl',
    'r2Key',
    'objectKey',
    'egressId',
    'fileAssetId',
  ];
  for (const key of forbidden) {
    if (json.includes(`"${key}"`)) {
      throw new Error(`Unsafe Video Meetings payload key leaked: ${key}`);
    }
  }
}
