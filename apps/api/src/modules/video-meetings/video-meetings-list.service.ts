import { Inject, Injectable } from '@nestjs/common';
import {
  PrismaClient,
  VideoMeetingStatus,
  type Prisma,
  type VideoMeetingEntityLinkType,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { CurrentUserPayload } from '../../common/decorators';
import { accessibleVideoMeetingWhere, parseVideoMeetingPage } from './video-meetings-access-query';
import { videoMeetingSessionActivityAt } from './video-meetings-activity';
import { assertVideoMeetingEntityAccessible } from './video-meetings-entity-access';
import { videoMeetingListInclude, type VideoMeetingListRow } from './video-meetings-includes';
import { VIDEO_MEETING_BY_ENTITY_SCAN_LIMIT } from './video-meetings.constants';
import { VIDEO_MEETING_IDLE_STATUSES } from './video-meetings-status';
import {
  assertSafeVideoMeetingPayload,
  serializeVideoMeetingListItem,
  type VideoMeetingListItemDto,
} from './video-meetings.serializer';
import type { ListVideoMeetingsQueryDto } from './dto/video-meetings.dto';
import type { VideoMeetingByEntityQueryDto } from './dto/video-meetings-thread.dto';

export type VideoMeetingListResult = {
  items: VideoMeetingListItemDto[];
  meta: { page: number; pageSize: number; total: number };
};

/** Room list, idle-room archive and "latest room for this record" lookup. */
@Injectable()
export class VideoMeetingsListService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  list(
    user: CurrentUserPayload,
    query: ListVideoMeetingsQueryDto,
  ): Promise<VideoMeetingListResult> {
    return this.page(accessibleVideoMeetingWhere(user.id, query.status), query);
  }

  /** Idle rooms that were held at least once (the former "ended calls" archive). */
  history(
    user: CurrentUserPayload,
    query: ListVideoMeetingsQueryDto,
  ): Promise<VideoMeetingListResult> {
    const where: Prisma.VideoMeetingWhereInput = {
      AND: [
        accessibleVideoMeetingWhere(user.id),
        { status: { in: [...VIDEO_MEETING_IDLE_STATUSES] } },
        { sessions: { some: {} } },
      ],
    };
    return this.page(where, query);
  }

  /** Latest non-cancelled room linked to the record and visible to the caller, or null. */
  async byEntity(
    user: CurrentUserPayload,
    query: VideoMeetingByEntityQueryDto,
  ): Promise<VideoMeetingListItemDto | null> {
    const entityType = query.entityType as VideoMeetingEntityLinkType;
    await assertVideoMeetingEntityAccessible(
      this.prisma,
      user.permissions,
      user.id,
      entityType,
      query.entityId,
    );
    const rows = await this.prisma.videoMeeting.findMany({
      where: {
        AND: [
          accessibleVideoMeetingWhere(user.id),
          { status: { not: VideoMeetingStatus.CANCELLED } },
          { entityLinks: { some: { entityType, entityId: query.entityId } } },
        ],
      },
      include: videoMeetingListInclude,
      orderBy: { updatedAt: 'desc' },
      take: VIDEO_MEETING_BY_ENTITY_SCAN_LIMIT,
    });
    const latest = pickMostRecentlyActive(rows);
    if (!latest) return null;
    const item = serializeVideoMeetingListItem(latest);
    assertSafeVideoMeetingPayload(item);
    return item;
  }

  private async page(
    where: Prisma.VideoMeetingWhereInput,
    query: ListVideoMeetingsQueryDto,
  ): Promise<VideoMeetingListResult> {
    const { page, pageSize } = parseVideoMeetingPage(query);
    const [rows, total] = await Promise.all([
      this.prisma.videoMeeting.findMany({
        where,
        include: videoMeetingListInclude,
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
}

function pickMostRecentlyActive(rows: readonly VideoMeetingListRow[]): VideoMeetingListRow | null {
  let best: VideoMeetingListRow | null = null;
  let bestAt = 0;
  for (const row of rows) {
    const at = videoMeetingSessionActivityAt(row).getTime();
    if (!best || at > bestAt) {
      best = row;
      bestAt = at;
    }
  }
  return best;
}
