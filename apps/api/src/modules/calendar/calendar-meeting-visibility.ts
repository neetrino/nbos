import type { Prisma, PrismaClient } from '@nbos/database';
import { isWideCalendarScope } from './calendar-access';

export type MeetingVisibilityIds = {
  linkedDealIds: string[];
  linkedProjectIds: string[];
  linkedContactIds: string[];
};

type MeetingRow = {
  createdById: string;
  internalParticipantIds: string[];
  dealId: string | null;
  projectId: string | null;
  contactId: string | null;
};

export async function fetchMeetingVisibilityIds(
  prisma: Pick<InstanceType<typeof PrismaClient>, 'deal' | 'product' | 'extension'>,
  userId: string,
): Promise<MeetingVisibilityIds> {
  const [deals, products, extensions] = await Promise.all([
    prisma.deal.findMany({
      where: {
        OR: [{ sellerId: userId }, { sellerAssistantId: userId }, { pmId: userId }],
      },
      select: { id: true, contactId: true },
    }),
    prisma.product.findMany({
      where: { pmId: userId },
      distinct: ['projectId'],
      select: { projectId: true },
    }),
    prisma.extension.findMany({
      where: { assignedTo: userId },
      distinct: ['projectId'],
      select: { projectId: true },
    }),
  ]);

  const linkedDealIds = deals.map((d) => d.id);
  const linkedContactIds = [
    ...new Set(
      deals.map((d) => d.contactId).filter((id): id is string => id != null && id.length > 0),
    ),
  ];
  const linkedProjectIds = [
    ...new Set([...products.map((p) => p.projectId), ...extensions.map((e) => e.projectId)]),
  ];

  return { linkedDealIds, linkedProjectIds, linkedContactIds };
}

export function buildNarrowMeetingVisibilityWhere(
  userId: string,
  ids: MeetingVisibilityIds,
): Prisma.CalendarMeetingWhereInput {
  return {
    OR: [
      { createdById: userId },
      { internalParticipantIds: { has: userId } },
      ...(ids.linkedDealIds.length > 0 ? [{ dealId: { in: ids.linkedDealIds } }] : []),
      ...(ids.linkedProjectIds.length > 0 ? [{ projectId: { in: ids.linkedProjectIds } }] : []),
      ...(ids.linkedContactIds.length > 0 ? [{ contactId: { in: ids.linkedContactIds } }] : []),
    ],
  };
}

export async function resolveMeetingListVisibilityWhere(
  prisma: Pick<InstanceType<typeof PrismaClient>, 'deal' | 'product' | 'extension'>,
  userId: string,
  accessScope: string,
): Promise<Prisma.CalendarMeetingWhereInput> {
  if (isWideCalendarScope(accessScope)) return {};
  const idSets = await fetchMeetingVisibilityIds(prisma, userId);
  return buildNarrowMeetingVisibilityWhere(userId, idSets);
}

export function isMeetingVisibleToViewer(
  meeting: MeetingRow,
  userId: string,
  accessScope: string,
  ids: MeetingVisibilityIds,
): boolean {
  if (isWideCalendarScope(accessScope)) return true;
  if (meeting.createdById === userId) return true;
  if (meeting.internalParticipantIds.includes(userId)) return true;
  if (meeting.dealId && ids.linkedDealIds.includes(meeting.dealId)) return true;
  if (meeting.projectId && ids.linkedProjectIds.includes(meeting.projectId)) return true;
  if (meeting.contactId && ids.linkedContactIds.includes(meeting.contactId)) return true;
  return false;
}
