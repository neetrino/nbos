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

export const videoMeetingListInclude = {
  entityLinks: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.VideoMeetingInclude;

export type VideoMeetingCardRow = Prisma.VideoMeetingGetPayload<{
  include: typeof videoMeetingCardInclude;
}>;
