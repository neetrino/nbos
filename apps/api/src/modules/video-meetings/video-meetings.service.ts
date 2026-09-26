import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PrismaClient,
  VideoMeetingStatus,
  type Prisma,
  type VideoMeetingEntityLinkType,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { CurrentUserPayload } from '../../common/decorators';
import { assertVideoMeetingEntityAccessible } from './video-meetings-entity-access';
import {
  accessibleVideoMeetingWhere,
  isVideoMeetingAccessible,
  parseVideoMeetingPage,
} from './video-meetings-access-query';
import { VIDEO_MEETING_DEFAULT_TITLE } from './video-meetings.constants';
import { generateOpaqueLivekitRoomName } from './video-meetings-room-name';
import { VideoMeetingsLivekitService } from './video-meetings-livekit.service';
import {
  assertSafeVideoMeetingPayload,
  serializeVideoMeetingCard,
  serializeVideoMeetingListItem,
  type VideoMeetingCardDto,
  type VideoMeetingListItemDto,
} from './video-meetings.serializer';
import type {
  AttachVideoMeetingEntityLinkDto,
  CreateVideoMeetingDto,
  ListVideoMeetingsQueryDto,
} from './dto/video-meetings.dto';
import { VideoMeetingStatusFilterDto } from './dto/video-meetings.dto';
import { VideoMeetingsRecordingService } from './video-meetings-recording.service';
import type { VideoMeetingRecordingGroupDto } from './video-meetings-recording.serializer';

const meetingCardInclude = {
  sessions: { orderBy: { createdAt: 'desc' as const } },
  entityLinks: { orderBy: { createdAt: 'asc' as const } },
  recordings: {
    orderBy: { createdAt: 'desc' as const },
    take: 5,
    include: { assets: true },
  },
} satisfies Prisma.VideoMeetingInclude;

const meetingListInclude = {
  entityLinks: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.VideoMeetingInclude;

type MeetingCardRow = Prisma.VideoMeetingGetPayload<{ include: typeof meetingCardInclude }>;

type ListResult = {
  items: VideoMeetingListItemDto[];
  meta: { page: number; pageSize: number; total: number };
};

@Injectable()
export class VideoMeetingsService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly livekit: VideoMeetingsLivekitService,
    private readonly recordings: VideoMeetingsRecordingService,
  ) {}

  /** Create an instant standalone meeting; host and owner are the authenticated employee. */
  async create(user: CurrentUserPayload, dto: CreateVideoMeetingDto): Promise<VideoMeetingCardDto> {
    const title = dto.title?.trim() || VIDEO_MEETING_DEFAULT_TITLE;
    const meeting = await this.prisma.videoMeeting.create({
      data: {
        title,
        status: VideoMeetingStatus.CREATED,
        hostEmployeeId: user.id,
        ownerEmployeeId: user.id,
        calendarMeetingId: null,
      },
      include: meetingCardInclude,
    });
    return this.toCard(meeting, user.permissions);
  }

  /**
   * Start meeting: persist session + opaque room name.
   * When LiveKit env is configured, ensure the room server-side (never trust the browser).
   */
  async start(user: CurrentUserPayload, meetingId: string): Promise<VideoMeetingCardDto> {
    const meeting = await this.requireHostOrOwner(meetingId, user.id);
    if (
      meeting.status === VideoMeetingStatus.ENDED ||
      meeting.status === VideoMeetingStatus.CANCELLED
    ) {
      throw new BadRequestException('Cannot start an ended or cancelled meeting');
    }
    if (meeting.status === VideoMeetingStatus.ACTIVE) {
      throw new BadRequestException('Meeting is already active');
    }
    const now = new Date();
    const livekitRoomName = generateOpaqueLivekitRoomName();
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
        include: meetingCardInclude,
      });
    });
    if (this.livekit.isConfigured()) {
      await this.livekit.ensureRoom(livekitRoomName);
    }
    return this.toCard(updated, user.permissions);
  }

  async list(user: CurrentUserPayload, query: ListVideoMeetingsQueryDto): Promise<ListResult> {
    const { page, pageSize } = parseVideoMeetingPage(query);
    const where = accessibleVideoMeetingWhere(user.id, query.status);
    const [rows, total] = await Promise.all([
      this.prisma.videoMeeting.findMany({
        where,
        include: meetingListInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.videoMeeting.count({ where }),
    ]);
    return {
      items: rows.map(serializeVideoMeetingListItem),
      meta: { page, pageSize, total },
    };
  }

  /** Ended meetings the caller may access (history). */
  async history(user: CurrentUserPayload, query: ListVideoMeetingsQueryDto): Promise<ListResult> {
    return this.list(user, { ...query, status: VideoMeetingStatusFilterDto.ENDED });
  }

  async getCard(user: CurrentUserPayload, meetingId: string): Promise<VideoMeetingCardDto> {
    const meeting = await this.prisma.videoMeeting.findUnique({
      where: { id: meetingId },
      include: {
        ...meetingCardInclude,
        participants: { select: { employeeId: true } },
      },
    });
    if (!meeting || !isVideoMeetingAccessible(meeting, user.id)) {
      throw new NotFoundException('Meeting not found');
    }
    return this.toCard(meeting, user.permissions);
  }

  /** Soft-end an active meeting (no hard delete of business history). */
  async end(user: CurrentUserPayload, meetingId: string): Promise<VideoMeetingCardDto> {
    const meeting = await this.requireHostOrOwner(meetingId, user.id);
    if (meeting.status !== VideoMeetingStatus.ACTIVE) {
      throw new BadRequestException('Only an active meeting can be ended');
    }
    // Stop capture if needed — never mark recording READY solely because meeting ended.
    await this.recordings.stopIfRecordingOnMeetingEnd(meetingId);
    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.videoMeetingSession.updateMany({
        where: { meetingId, endedAt: null },
        data: { endedAt: now },
      });
      return tx.videoMeeting.update({
        where: { id: meetingId },
        data: { status: VideoMeetingStatus.ENDED, endedAt: now },
        include: meetingCardInclude,
      });
    });
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
  async cancel(user: CurrentUserPayload, meetingId: string): Promise<VideoMeetingCardDto> {
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
      include: meetingCardInclude,
    });
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
    meeting: MeetingCardRow,
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
