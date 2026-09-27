import type { Prisma } from '@nbos/database';

export const videoMeetingCardInclude = {
  sessions: { orderBy: { createdAt: 'desc' as const } },
  entityLinks: { orderBy: { createdAt: 'asc' as const } },
  recordings: {
    orderBy: { createdAt: 'desc' as const },
    take: 5,
    include: { assets: true },
  },
} satisfies Prisma.VideoMeetingInclude;

/** Latest session + latest message are enough for `lastActivityAt`. */
export const videoMeetingListInclude = {
  entityLinks: { orderBy: { createdAt: 'asc' as const } },
  sessions: { orderBy: { createdAt: 'desc' as const }, take: 1 },
  messages: { orderBy: { createdAt: 'desc' as const }, take: 1, select: { createdAt: true } },
  _count: { select: { recordings: true } },
} satisfies Prisma.VideoMeetingInclude;

export type VideoMeetingListRow = Prisma.VideoMeetingGetPayload<{
  include: typeof videoMeetingListInclude;
}>;

export type VideoMeetingCardRow = Prisma.VideoMeetingGetPayload<{
  include: typeof videoMeetingCardInclude;
}>;
