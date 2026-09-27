import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, VideoMeetingStatus } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { CurrentUserPayload } from '../../common/decorators';
import { isVideoMeetingAccessible } from './video-meetings-access-query';
import { assertSafeGuestPayload, buildEmployeeDisplayName } from './video-meetings-guest-safety';
import { requireAdmittedLiveGuest } from './video-meetings-guest-thread-access';
import { VideoMeetingsInvitesService } from './video-meetings-invites.service';
import {
  VIDEO_MEETING_MESSAGE_MAX_LENGTH,
  VIDEO_MEETING_THREAD_MAX_MESSAGES,
} from './video-meetings.constants';
import { assertSafeVideoMeetingPayload } from './video-meetings.serializer';
import {
  buildGuestThread,
  buildVideoMeetingThread,
  serializeGuestThreadMessage,
  serializeThreadMessage,
  type GuestThreadDto,
  type GuestThreadMessageDto,
  type ThreadRows,
  type VideoMeetingThreadDto,
  type VideoMeetingThreadMessageDto,
} from './video-meetings-thread.serializer';

type MessageAuthor = {
  sessionId: string | null;
  authorParticipantId: string | null;
  employeeId: string | null;
  authorDisplayName: string;
};

/** Trim and bound a plain-text chat body; empty after trim is rejected. */
export function normalizeVideoMeetingMessageBody(raw: string): string {
  const body = raw.trim();
  if (!body) throw new BadRequestException('Message is empty');
  if (body.length > VIDEO_MEETING_MESSAGE_MAX_LENGTH) {
    throw new BadRequestException('Message is too long');
  }
  return body;
}

/** Persisted room chat + review thread. LiveKit chat is transport only; Postgres is the record. */
@Injectable()
export class VideoMeetingsThreadService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly invites: VideoMeetingsInvitesService,
  ) {}

  async getThread(user: CurrentUserPayload, meetingId: string): Promise<VideoMeetingThreadDto> {
    await this.requireViewer(meetingId, user.id);
    const thread = buildVideoMeetingThread(meetingId, await this.loadRows(meetingId), true);
    assertSafeVideoMeetingPayload(thread);
    return thread;
  }

  async postMessage(
    user: CurrentUserPayload,
    meetingId: string,
    rawBody: string,
  ): Promise<VideoMeetingThreadMessageDto> {
    const body = normalizeVideoMeetingMessageBody(rawBody);
    const status = await this.requireViewer(meetingId, user.id);
    if (status === VideoMeetingStatus.CANCELLED) {
      throw new BadRequestException('Cannot post to a cancelled meeting');
    }
    const author = await this.resolveEmployeeAuthor(user, meetingId, status);
    const message = serializeThreadMessage(await this.createMessage(meetingId, author, body));
    assertSafeVideoMeetingPayload(message);
    return message;
  }

  async guestThread(inviteToken: string): Promise<GuestThreadDto> {
    const guest = await requireAdmittedLiveGuest(this.prisma, this.invites, inviteToken);
    const thread = buildGuestThread(await this.loadRows(guest.meetingId));
    assertSafeGuestPayload(thread);
    return thread;
  }

  async guestPostMessage(inviteToken: string, rawBody: string): Promise<GuestThreadMessageDto> {
    const body = normalizeVideoMeetingMessageBody(rawBody);
    const guest = await requireAdmittedLiveGuest(this.prisma, this.invites, inviteToken);
    const row = await this.createMessage(
      guest.meetingId,
      {
        sessionId: guest.sessionId,
        authorParticipantId: guest.participantId,
        employeeId: null,
        authorDisplayName: guest.displayName,
      },
      body,
    );
    const message = serializeGuestThreadMessage(row);
    assertSafeGuestPayload(message);
    return message;
  }

  private createMessage(meetingId: string, author: MessageAuthor, body: string) {
    return this.prisma.videoMeetingMessage.create({ data: { meetingId, ...author, body } });
  }

  /** In a live session: open session + caller's participant row. Between sessions: null. */
  private async resolveEmployeeAuthor(
    user: CurrentUserPayload,
    meetingId: string,
    status: VideoMeetingStatus,
  ): Promise<MessageAuthor> {
    const base = {
      employeeId: user.id,
      authorDisplayName: buildEmployeeDisplayName(user),
    };
    if (status !== VideoMeetingStatus.ACTIVE) {
      return { ...base, sessionId: null, authorParticipantId: null };
    }
    const open = await this.prisma.videoMeetingSession.findFirst({
      where: { meetingId, endedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (!open) return { ...base, sessionId: null, authorParticipantId: null };
    const participant = await this.prisma.videoMeetingParticipant.findFirst({
      where: { meetingId, employeeId: user.id, sessionId: open.id },
      select: { id: true },
    });
    return { ...base, sessionId: open.id, authorParticipantId: participant?.id ?? null };
  }

  private async requireViewer(meetingId: string, employeeId: string): Promise<VideoMeetingStatus> {
    const meeting = await this.prisma.videoMeeting.findUnique({
      where: { id: meetingId },
      include: { participants: { select: { employeeId: true } } },
    });
    if (!meeting || !isVideoMeetingAccessible(meeting, employeeId)) {
      throw new NotFoundException('Meeting not found');
    }
    return meeting.status;
  }

  private async loadRows(meetingId: string): Promise<ThreadRows> {
    const [latestMessages, sessions, recordings] = await Promise.all([
      this.prisma.videoMeetingMessage.findMany({
        where: { meetingId },
        orderBy: { createdAt: 'desc' },
        take: VIDEO_MEETING_THREAD_MAX_MESSAGES,
      }),
      this.prisma.videoMeetingSession.findMany({
        where: { meetingId },
        orderBy: { createdAt: 'asc' },
        select: { id: true, startedAt: true, endedAt: true, createdAt: true },
      }),
      this.prisma.videoMeetingRecording.findMany({
        where: { meetingId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          sessionId: true,
          status: true,
          startedAt: true,
          stoppedAt: true,
          createdAt: true,
          assets: { select: { kind: true, status: true, fileAssetId: true } },
        },
      }),
    ]);
    return { messages: [...latestMessages].reverse(), sessions, recordings };
  }
}
