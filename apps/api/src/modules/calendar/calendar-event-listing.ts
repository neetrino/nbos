import type { PrismaClient, Prisma } from '@nbos/database';
import {
  deliveryExtensionWhere,
  deliveryProductWhere,
  isWideCalendarScope,
} from './calendar-access';
import { extensionDeadlineProjection, productDeadlineProjection } from './calendar-projections';
import type { CalendarEventProjection } from './calendar.types';

export async function fetchMeetingCalendarProjections(
  prisma: Pick<InstanceType<typeof PrismaClient>, 'calendarMeeting'>,
  userId: string,
  accessScope: string,
  from: Date,
  to: Date,
): Promise<CalendarEventProjection[]> {
  const visibility: Prisma.CalendarMeetingWhereInput = isWideCalendarScope(accessScope)
    ? {}
    : { OR: [{ createdById: userId }, { internalParticipantIds: { has: userId } }] };
  const rows = await prisma.calendarMeeting.findMany({
    where: { startsAt: { lt: to }, endsAt: { gt: from }, ...visibility },
    orderBy: { startsAt: 'asc' },
  });
  return rows.map<CalendarEventProjection>((row) => ({
    id: `meeting:${row.id}`,
    layer: 'MEETINGS',
    title: row.title,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    isAllDay: false,
    description: row.agenda,
    status: row.status,
    sourceType: 'MEETING',
    sourceId: row.id,
    sourceHref: null,
    badge: row.meetingType,
    projectName: null,
    ownerName: null,
  }));
}

export async function fetchDeliveryDeadlineProjections(
  prisma: Pick<InstanceType<typeof PrismaClient>, 'product' | 'extension'>,
  userId: string,
  scope: string,
  from: Date,
  to: Date,
): Promise<CalendarEventProjection[]> {
  const [products, extensions] = await Promise.all([
    prisma.product.findMany({
      where: deliveryProductWhere(userId, scope, from, to),
      include: { project: { select: { id: true, name: true } }, pm: true },
      orderBy: { deadline: 'asc' },
    }),
    prisma.extension.findMany({
      where: deliveryExtensionWhere(userId, scope, from, to),
      include: { project: { select: { id: true, name: true } }, product: true, assignee: true },
      orderBy: { deadline: 'asc' },
    }),
  ]);
  return [
    ...products.map(productDeadlineProjection),
    ...extensions.map(extensionDeadlineProjection),
  ];
}

export async function fetchPersonalCalendarProjections(
  prisma: Pick<InstanceType<typeof PrismaClient>, 'personalCalendarEvent'>,
  userId: string,
  from: Date,
  to: Date,
): Promise<CalendarEventProjection[]> {
  const rows = await prisma.personalCalendarEvent.findMany({
    where: { ownerId: userId, status: 'ACTIVE', startsAt: { lt: to }, endsAt: { gt: from } },
    orderBy: { startsAt: 'asc' },
  });
  return rows.map<CalendarEventProjection>((row) => ({
    id: `personal:${row.id}`,
    layer: 'PERSONAL',
    title: row.title,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    isAllDay: row.isAllDay,
    description: row.notes,
    status: row.status,
    sourceType: 'PERSONAL_EVENT',
    sourceId: row.id,
    sourceHref: null,
    badge: 'Personal',
    projectName: null,
    ownerName: null,
  }));
}
