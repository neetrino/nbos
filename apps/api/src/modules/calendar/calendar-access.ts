import type { Prisma } from '@nbos/database';

export function isWideCalendarScope(scope: string): boolean {
  return scope === 'ALL';
}

export function deliveryProductWhere(
  userId: string,
  scope: string,
  from: Date,
  to: Date,
): Prisma.ProductWhereInput {
  return {
    deadline: { gte: from, lt: to },
    status: { notIn: ['DONE', 'LOST'] },
    deliveryResolution: { notIn: ['DONE', 'CANCELLED'] },
    ...(isWideCalendarScope(scope) ? {} : { pmId: userId }),
  };
}

export function deliveryExtensionWhere(
  userId: string,
  scope: string,
  from: Date,
  to: Date,
): Prisma.ExtensionWhereInput {
  return {
    deadline: { gte: from, lt: to },
    status: { notIn: ['DONE', 'LOST'] },
    deliveryResolution: { notIn: ['DONE', 'CANCELLED'] },
    ...(isWideCalendarScope(scope) ? {} : { assignedTo: userId }),
  };
}
