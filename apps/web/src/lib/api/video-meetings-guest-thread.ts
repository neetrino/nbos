import type { VideoMeetingRecordingStatus } from './video-meetings';

export type GuestVideoMeetingThreadMessage = {
  type: 'message';
  at: string;
  id: string;
  authorParticipantId: string | null;
  authorDisplayName: string;
  body: string;
  createdAt: string;
};

export type GuestVideoMeetingThreadRecordingNote = {
  type: 'recording_note';
  at: string;
  status: VideoMeetingRecordingStatus;
};

export type GuestVideoMeetingThreadItem =
  | GuestVideoMeetingThreadMessage
  | GuestVideoMeetingThreadRecordingNote;

export type GuestVideoMeetingThread = { items: GuestVideoMeetingThreadItem[] };

function unwrapGuestPayload<T>(body: { data?: T } | T): T {
  return typeof body === 'object' && body !== null && 'data' in body && body.data
    ? body.data
    : (body as T);
}

export async function guestThread(inviteToken: string): Promise<GuestVideoMeetingThread> {
  const resp = await fetch('/api/bff/video-meetings/guest/thread', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteToken }),
  });
  if (!resp.ok) {
    throw new Error(`Guest thread failed (${resp.status})`);
  }
  const body = (await resp.json()) as { data?: GuestVideoMeetingThread } | GuestVideoMeetingThread;
  return unwrapGuestPayload(body);
}

export async function guestPostMessage(
  inviteToken: string,
  body: string,
): Promise<GuestVideoMeetingThreadMessage> {
  const resp = await fetch('/api/bff/video-meetings/guest/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteToken, body }),
  });
  if (!resp.ok) {
    throw new Error(`Guest message failed (${resp.status})`);
  }
  const json = (await resp.json()) as
    | { data?: GuestVideoMeetingThreadMessage }
    | GuestVideoMeetingThreadMessage;
  return unwrapGuestPayload(json);
}
