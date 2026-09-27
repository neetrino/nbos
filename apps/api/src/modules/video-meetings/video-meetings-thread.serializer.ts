import {
  VideoMeetingRecordingAssetKind,
  VideoMeetingRecordingAssetStatus,
  VideoMeetingRecordingStatus,
} from '@nbos/database';

export type ThreadMessageRow = {
  id: string;
  sessionId: string | null;
  authorParticipantId: string | null;
  employeeId: string | null;
  authorDisplayName: string;
  body: string;
  createdAt: Date;
};

export type ThreadSessionRow = {
  id: string;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
};

export type ThreadRecordingRow = {
  id: string;
  sessionId: string | null;
  status: VideoMeetingRecordingStatus;
  startedAt: Date | null;
  stoppedAt: Date | null;
  createdAt: Date;
  assets: {
    kind: VideoMeetingRecordingAssetKind;
    status: VideoMeetingRecordingAssetStatus;
    fileAssetId: string | null;
  }[];
};

export type ThreadRows = {
  messages: ThreadMessageRow[];
  sessions: ThreadSessionRow[];
  recordings: ThreadRecordingRow[];
};

export type VideoMeetingThreadMessageDto = {
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

export type VideoMeetingThreadSessionDto = {
  type: 'session';
  at: string;
  id: string;
  startedAt: string | null;
  endedAt: string | null;
};

/** No playback URL or Drive id; `playable` only says the private player may be offered. */
export type VideoMeetingThreadRecordingDto = {
  type: 'recording';
  at: string;
  id: string;
  sessionId: string | null;
  status: VideoMeetingRecordingStatus;
  playable: boolean;
};

export type VideoMeetingThreadItemDto =
  | VideoMeetingThreadMessageDto
  | VideoMeetingThreadSessionDto
  | VideoMeetingThreadRecordingDto;

export type VideoMeetingThreadDto = { meetingId: string; items: VideoMeetingThreadItemDto[] };

export type GuestThreadMessageDto = {
  type: 'message';
  at: string;
  id: string;
  authorParticipantId: string | null;
  authorDisplayName: string;
  body: string;
  createdAt: string;
};

/** A recording exists; guests never get a player, asset list or playable flag. */
export type GuestThreadRecordingNoteDto = {
  type: 'recording_note';
  at: string;
  status: VideoMeetingRecordingStatus;
};

export type GuestThreadDto = { items: (GuestThreadMessageDto | GuestThreadRecordingNoteDto)[] };

/** Sessions sort before messages, recordings after, when times are equal. */
const RANK_SESSION = 0;
const RANK_MESSAGE = 1;
const RANK_RECORDING = 2;

type Placed<T> = { at: Date; rank: number; item: T };

const PLAYABLE_GROUP_STATUSES: ReadonlySet<VideoMeetingRecordingStatus> = new Set([
  VideoMeetingRecordingStatus.READY,
  VideoMeetingRecordingStatus.PARTIAL,
]);

function sortPlaced<T>(placed: Placed<T>[]): T[] {
  return placed
    .sort((a, b) => a.at.getTime() - b.at.getTime() || a.rank - b.rank)
    .map((entry) => entry.item);
}

/** Capture stop time, else the end of a session that closed while capture was open. */
function recordingPlacedAt(recording: ThreadRecordingRow, sessions: ThreadSessionRow[]): Date {
  const session = sessions.find((row) => row.id === recording.sessionId);
  return recording.stoppedAt ?? session?.endedAt ?? recording.startedAt ?? recording.createdAt;
}

function hasPlayableComposite(recording: ThreadRecordingRow): boolean {
  if (!PLAYABLE_GROUP_STATUSES.has(recording.status)) return false;
  return recording.assets.some(
    (asset) =>
      asset.kind === VideoMeetingRecordingAssetKind.ROOM_COMPOSITE &&
      asset.status === VideoMeetingRecordingAssetStatus.READY &&
      asset.fileAssetId !== null,
  );
}

export function serializeThreadMessage(row: ThreadMessageRow): VideoMeetingThreadMessageDto {
  const at = row.createdAt.toISOString();
  return {
    type: 'message',
    at,
    id: row.id,
    sessionId: row.sessionId,
    authorParticipantId: row.authorParticipantId,
    employeeId: row.employeeId,
    authorDisplayName: row.authorDisplayName,
    body: row.body,
    createdAt: at,
  };
}

export function serializeGuestThreadMessage(row: ThreadMessageRow): GuestThreadMessageDto {
  const at = row.createdAt.toISOString();
  return {
    type: 'message',
    at,
    id: row.id,
    authorParticipantId: row.authorParticipantId,
    authorDisplayName: row.authorDisplayName,
    body: row.body,
    createdAt: at,
  };
}

function placeSession(row: ThreadSessionRow): Placed<VideoMeetingThreadSessionDto> {
  const at = row.startedAt ?? row.createdAt;
  return {
    at,
    rank: RANK_SESSION,
    item: {
      type: 'session',
      at: at.toISOString(),
      id: row.id,
      startedAt: row.startedAt?.toISOString() ?? null,
      endedAt: row.endedAt?.toISOString() ?? null,
    },
  };
}

/** Employee review thread: messages, session markers and recording cards, oldest first. */
export function buildVideoMeetingThread(
  meetingId: string,
  rows: ThreadRows,
  callerMayPlay: boolean,
): VideoMeetingThreadDto {
  const placed: Placed<VideoMeetingThreadItemDto>[] = [
    ...rows.sessions.map(placeSession),
    ...rows.messages.map((row) => ({
      at: row.createdAt,
      rank: RANK_MESSAGE,
      item: serializeThreadMessage(row),
    })),
    ...rows.recordings.map((recording) => {
      const at = recordingPlacedAt(recording, rows.sessions);
      const item: VideoMeetingThreadRecordingDto = {
        type: 'recording',
        at: at.toISOString(),
        id: recording.id,
        sessionId: recording.sessionId,
        status: recording.status,
        playable: callerMayPlay && hasPlayableComposite(recording),
      };
      return { at, rank: RANK_RECORDING, item };
    }),
  ];
  return { meetingId, items: sortPlaced(placed) };
}

/** Guest thread: messages plus non-playable recording notes. No sessions, ids of assets or links. */
export function buildGuestThread(rows: ThreadRows): GuestThreadDto {
  const placed: Placed<GuestThreadDto['items'][number]>[] = [
    ...rows.messages.map((row) => ({
      at: row.createdAt,
      rank: RANK_MESSAGE,
      item: serializeGuestThreadMessage(row),
    })),
    ...rows.recordings.map((recording) => {
      const at = recordingPlacedAt(recording, rows.sessions);
      const item: GuestThreadRecordingNoteDto = {
        type: 'recording_note',
        at: at.toISOString(),
        status: recording.status,
      };
      return { at, rank: RANK_RECORDING, item };
    }),
  ];
  return { items: sortPlaced(placed) };
}
