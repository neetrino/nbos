import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { CurrentUserPayload } from '../../common/decorators';
import { CalendarService } from '../calendar/calendar.service';
import { VIDEO_MEETING_CALENDAR_DEFAULT_DURATION_MS } from './video-meetings.constants';
import { noteCalendarLinkedReminderOwnership } from './video-meetings-calendar-reminders';
import type { CreateVideoMeetingDto } from './dto/video-meetings.dto';

/**
 * Optional CalendarMeeting bridge. Calendar owns schedule/conflicts/reminders;
 * Video Meetings never auto-creates a CalendarMeeting for every call.
 */
@Injectable()
export class VideoMeetingsCalendarLinkService {
  private readonly logger = new Logger(VideoMeetingsCalendarLinkService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly calendar: CalendarService,
  ) {}

  /**
   * Resolves optional calendar link for create.
   * Standalone (no calendar options) never calls Calendar and returns null.
   * Explicit create-calendar failures degrade to null so the video meeting still succeeds.
   */
  async resolveCalendarMeetingIdForCreate(
    user: CurrentUserPayload,
    dto: CreateVideoMeetingDto,
    meetingTitle: string,
  ): Promise<string | null> {
    if (dto.calendarMeetingId && dto.createCalendarMeeting) {
      throw new BadRequestException(
        'Provide either calendarMeetingId or createCalendarMeeting, not both',
      );
    }
    if (dto.calendarMeetingId) {
      return this.attachExisting(user, dto.calendarMeetingId);
    }
    if (dto.createCalendarMeeting) {
      return this.tryCreateCalendarMeeting(user, dto, meetingTitle);
    }
    return null;
  }

  /**
   * Optionally cancel the linked CalendarMeeting. Requires explicit confirm flag;
   * never cascades from video cancel/end alone.
   */
  async maybeCancelLinkedCalendar(
    user: CurrentUserPayload,
    calendarMeetingId: string | null,
    alsoCancelCalendarMeeting: boolean | undefined,
  ): Promise<void> {
    if (!alsoCancelCalendarMeeting || !calendarMeetingId) return;
    const scope = user.permissions['CALENDAR_EDIT']?.trim().toUpperCase() || 'OWN';
    try {
      await this.calendar.updateMeeting(user.id, scope, calendarMeetingId, {
        status: 'CANCELLED',
      });
    } catch (error) {
      this.logger.warn(
        `Calendar cancel for ${calendarMeetingId} failed after video lifecycle: ${String(error)}`,
      );
      throw new BadRequestException(
        'Video meeting updated, but CalendarMeeting cancel failed. Retry calendar cancel separately.',
      );
    }
  }

  private async attachExisting(
    user: CurrentUserPayload,
    calendarMeetingId: string,
  ): Promise<string> {
    const scope = user.permissions['CALENDAR_VIEW']?.trim().toUpperCase() || 'OWN';
    try {
      const meeting = await this.calendar.getMeetingById(user.id, scope, calendarMeetingId);
      noteCalendarLinkedReminderOwnership(meeting.id);
      return meeting.id;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const exists = await this.prisma.calendarMeeting.findUnique({
        where: { id: calendarMeetingId },
        select: { id: true },
      });
      if (!exists) throw new NotFoundException('Calendar meeting not found');
      throw error;
    }
  }

  private async tryCreateCalendarMeeting(
    user: CurrentUserPayload,
    dto: CreateVideoMeetingDto,
    meetingTitle: string,
  ): Promise<string | null> {
    const startsAt = dto.calendarStartsAt ? new Date(dto.calendarStartsAt) : new Date();
    const endsAt = dto.calendarEndsAt
      ? new Date(dto.calendarEndsAt)
      : new Date(startsAt.getTime() + VIDEO_MEETING_CALENDAR_DEFAULT_DURATION_MS);
    try {
      const created = await this.calendar.createMeeting(user.id, {
        title: meetingTitle,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        locationType: 'ONLINE',
        status: 'SCHEDULED',
      });
      noteCalendarLinkedReminderOwnership(created.id);
      return created.id;
    } catch (error) {
      this.logger.warn(
        `CalendarMeeting create failed; continuing with standalone video meeting: ${String(error)}`,
      );
      return null;
    }
  }
}
