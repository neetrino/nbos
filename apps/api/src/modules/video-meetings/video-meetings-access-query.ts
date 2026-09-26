import type { Prisma, VideoMeetingStatus } from '@nbos/database';
import type { ListVideoMeetingsQueryDto } from './dto/video-meetings.dto';
import {
  VIDEO_MEETING_LIST_DEFAULT_PAGE_SIZE,
  VIDEO_MEETING_LIST_MAX_PAGE_SIZE,
} from './video-meetings.constants';

export function parseVideoMeetingPage(query: ListVideoMeetingsQueryDto): {
  page: number;
  pageSize: number;
} {
  const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
  const rawSize =
    parseInt(query.pageSize ?? String(VIDEO_MEETING_LIST_DEFAULT_PAGE_SIZE), 10) ||
    VIDEO_MEETING_LIST_DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(VIDEO_MEETING_LIST_MAX_PAGE_SIZE, Math.max(1, rawSize));
  return { page, pageSize };
}

export function accessibleVideoMeetingWhere(
  employeeId: string,
  status?: string,
): Prisma.VideoMeetingWhereInput {
  const where: Prisma.VideoMeetingWhereInput = {
    OR: [
      { hostEmployeeId: employeeId },
      { ownerEmployeeId: employeeId },
      { participants: { some: { employeeId } } },
    ],
  };
  if (status) {
    where.status = status as VideoMeetingStatus;
  }
  return where;
}

export function isVideoMeetingAccessible(
  meeting: {
    hostEmployeeId: string;
    ownerEmployeeId: string;
    participants?: { employeeId: string | null }[];
  },
  employeeId: string,
): boolean {
  if (meeting.hostEmployeeId === employeeId || meeting.ownerEmployeeId === employeeId) {
    return true;
  }
  return (meeting.participants ?? []).some((p) => p.employeeId === employeeId);
}
