import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient, VideoMeetingStatus, type VideoMeetingEntityLinkType } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { CurrentUserPayload } from '../../common/decorators';
import { assertVideoMeetingEntityAccessible } from './video-meetings-entity-access';
import { isVideoMeetingAccessible } from './video-meetings-access-query';
import { VIDEO_MEETING_DEFAULT_TITLE } from './video-meetings.constants';
import { generateOpaqueLivekitRoomName } from './video-meetings-room-name';
import { closeOpenMeetingRoom } from './video-meetings-close-room';
import { authorizeMeetingEnd } from './video-meetings-end-access';
import { VideoMeetingsLivekitService } from './video-meetings-livekit.service';
import {
  assertSafeVideoMeetingPayload,
  serializeVideoMeetingCard,
  type VideoMeetingCardDto,
} from './video-meetings.serializer';
import type {
  AttachVideoMeetingEntityLinkDto,
  CreateVideoMeetingDto,
  VideoMeetingLifecycleConfirmDto,
} from './dto/video-meetings.dto';
import { VideoMeetingsRecordingService } from './video-meetings-recording.service';
import type { VideoMeetingRecordingGroupDto } from './video-meetings-recording.serializer';
import { VideoMeetingsCalendarLinkService } from './video-meetings-calendar-link.service';
import { videoMeetingCardInclude, type VideoMeetingCardRow } from './video-meetings-includes';
import { canStartVideoMeeting } from './video-meetings-status';

@Injectable()
export class VideoMeetingsService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly livekit: VideoMeetingsLivekitService,
    private readonly recordings: VideoMeetingsRecordingService,
    private readonly calendarLink: VideoMeetingsCalendarLinkService,
  ) {}

  async create(user: CurrentUserPayload, dto: CreateVideoMeetingDto): Promise<VideoMeetingCardDto> {
    const title = dto.title?.trim() || VIDEO_MEETING_DEFAULT_TITLE;
    const calendarMeetingId = await this.calendarLink.resolveCalendarMeetingIdForCreate(
      user,
      dto,
      title,
    );
    const meeting = await this.prisma.videoMeeting.create({
      data: {
        title,
        status: VideoMeetingStatus.CREATED,
        hostEmployeeId: user.id,
        ownerEmployeeId: user.id,
        calendarMeetingId,
      },
      include: videoMeetingCardInclude,
    });
    return this.toCard(meeting, user.permissions);
  }

  async rename(user: CurrentUserPayload, meetingId: string, title: string) {
    await this.requireHostOrOwner(meetingId, user.id);
    const trimmed = title.trim();
    if (!trimmed) throw new BadRequestException('Title is required');
    const updated = await this.prisma.videoMeeting.update({
      where: { id: meetingId },
      data: { title: trimmed },
      include: videoMeetingCardInclude,
    });
    return this.toCard(updated, user.permissions);
  }

  async start(user: CurrentUserPayload, meetingId: string): Promise<VideoMeetingCardDto> {
    const meeting = await this.requireHostOrOwner(meetingId, user.id);
    if (meeting.status === VideoMeetingStatus.ACTIVE) {
      throw new BadRequestException('Meeting is already active');
    }
    if (!canStartVideoMeeting(meeting.status)) {
      throw new BadRequestException('Cannot start a cancelled meeting');
    }
    const now = new Date();
    const livekitRoomName = generateOpaqueLivekitRoomName();
    const liveKitConfigured = this.livekit.isConfigured();
    if (liveKitConfigured) {
      await this.livekit.ensureRoom(livekitRoomName);
    }
    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        await tx.videoMeetingSession.create({
          data: {
            meetingId,
            livekitRoomName,
            startedAt: now,
          },
        });
        return tx.videoMeeting.update({
          where: { id: meetingId },
          data: { status: VideoMeetingStatus.ACTIVE },
          include: videoMeetingCardInclude,
        });
      });
      return this.toCard(updated, user.permissions);
    } catch (error) {
      if (liveKitConfigured) await this.livekit.closeRoom(livekitRoomName);
      throw error;
    }
  }

  async getCard(user: CurrentUserPayload, meetingId: string): Promise<VideoMeetingCardDto> {
    const meeting = await this.prisma.videoMeeting.findUnique({
      where: { id: meetingId },
      include: {
        ...videoMeetingCardInclude,
        participants: { select: { employeeId: true } },
      },
    });
    if (!meeting || !isVideoMeetingAccessible(meeting, user.id)) {
      throw new NotFoundException('Meeting not found');
    }
    return this.toCard(meeting, user.permissions);
  }

  /** End the open session; the room goes IDLE and keeps people, messages and recordings. */
  async end(
    user: CurrentUserPayload,
    meetingId: string,
    confirm?: VideoMeetingLifecycleConfirmDto,
  ): Promise<VideoMeetingCardDto> {
    const meeting = await this.prisma.videoMeeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.status !== VideoMeetingStatus.ACTIVE) {
      throw new BadRequestException('Only an active meeting can be ended');
    }
    const access = await authorizeMeetingEnd(this.prisma, this.livekit, meetingId, user.id);
    await this.recordings.stopIfRecordingOnMeetingEnd(meetingId);
    await closeOpenMeetingRoom(this.prisma, this.livekit, meetingId);
    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.videoMeetingSession.updateMany({
        where: { meetingId, endedAt: null },
        data: { endedAt: now },
      });
      return tx.videoMeeting.update({
        where: { id: meetingId },
        data: { status: VideoMeetingStatus.IDLE, endedAt: now },
        include: videoMeetingCardInclude,
      });
    });
    if (access.mayCancelCalendar) {
      await this.calendarLink.maybeCancelLinkedCalendar(
        user,
        meeting.calendarMeetingId,
        confirm?.alsoCancelCalendarMeeting,
      );
    }
    return this.toCard(updated, user.permissions);
  }

  async getRecordingStatus(
    user: CurrentUserPayload,
    meetingId: string,
  ): Promise<{ recording: VideoMeetingRecordingGroupDto | null }> {
    const meeting = await this.prisma.videoMeeting.findUnique({
      where: { id: meetingId },
      include: { participants: { select: { employeeId: true } } },
    });
    if (!meeting || !isVideoMeetingAccessible(meeting, user.id)) {
      throw new NotFoundException('Meeting not found');
    }
    const recording = await this.recordings.getActiveStatus(meetingId);
    const payload = { recording };
    assertSafeVideoMeetingPayload(payload);
    return payload;
  }

  /** Soft-cancel a meeting that was never held. */
  async cancel(
    user: CurrentUserPayload,
    meetingId: string,
    confirm?: VideoMeetingLifecycleConfirmDto,
  ): Promise<VideoMeetingCardDto> {
    const meeting = await this.requireHostOrOwner(meetingId, user.id);
    if (
      meeting.status !== VideoMeetingStatus.CREATED &&
      meeting.status !== VideoMeetingStatus.WAITING
    ) {
      throw new BadRequestException('Only a created or waiting meeting can be cancelled');
    }
    const updated = await this.prisma.videoMeeting.update({
      where: { id: meetingId },
      data: { status: VideoMeetingStatus.CANCELLED, cancelledAt: new Date() },
      include: videoMeetingCardInclude,
    });
    await this.calendarLink.maybeCancelLinkedCalendar(
      user,
      meeting.calendarMeetingId,
      confirm?.alsoCancelCalendarMeeting,
    );
    return this.toCard(updated, user.permissions);
  }

  /** Attach Deal/Project/Product/Contact before or after the meeting ends. */
  async attachEntityLink(
    user: CurrentUserPayload,
    meetingId: string,
    dto: AttachVideoMeetingEntityLinkDto,
  ): Promise<VideoMeetingCardDto> {
    await this.requireHostOrOwner(meetingId, user.id);
    await assertVideoMeetingEntityAccessible(
      this.prisma,
      user.permissions,
      user.id,
      dto.entityType,
      dto.entityId,
    );
    try {
      await this.prisma.videoMeetingEntityLink.create({
        data: {
          meetingId,
          entityType: dto.entityType as VideoMeetingEntityLinkType,
          entityId: dto.entityId,
        },
      });
    } catch {
      throw new BadRequestException('Entity link already exists or is invalid');
    }
    return this.getCard(user, meetingId);
  }

  /** Detach an entity link (not a hard delete of the meeting). */
  async detachEntityLink(
    user: CurrentUserPayload,
    meetingId: string,
    linkId: string,
  ): Promise<VideoMeetingCardDto> {
    await this.requireHostOrOwner(meetingId, user.id);
    const link = await this.prisma.videoMeetingEntityLink.findFirst({
      where: { id: linkId, meetingId },
    });
    if (!link) {
      throw new NotFoundException('Entity link not found');
    }
    await this.prisma.videoMeetingEntityLink.delete({ where: { id: linkId } });
    return this.getCard(user, meetingId);
  }

  private toCard(
    meeting: VideoMeetingCardRow,
    permissions: Readonly<Record<string, string>>,
  ): VideoMeetingCardDto {
    const card = serializeVideoMeetingCard(meeting, permissions);
    assertSafeVideoMeetingPayload(card);
    return card;
  }

  private async requireHostOrOwner(meetingId: string, employeeId: string) {
    const meeting = await this.prisma.videoMeeting.findUnique({ where: { id: meetingId } });
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }
    if (meeting.hostEmployeeId !== employeeId && meeting.ownerEmployeeId !== employeeId) {
      throw new ForbiddenException('Only host or owner may modify this meeting');
    }
    return meeting;
  }
}
