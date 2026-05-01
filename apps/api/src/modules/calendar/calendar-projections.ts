import type { Prisma } from '@nbos/database';
import type { CalendarEventProjection } from './calendar.types';

const APPROACHING_DEADLINE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export type ProductDeadlineRow = Prisma.ProductGetPayload<{
  include: { project: { select: { id: true; name: true } }; pm: true };
}>;

export type ExtensionDeadlineRow = Prisma.ExtensionGetPayload<{
  include: { project: { select: { id: true; name: true } }; product: true; assignee: true };
}>;

export function productDeadlineProjection(row: ProductDeadlineRow): CalendarEventProjection {
  const deadline = row.deadline ?? new Date();
  return {
    id: `product-deadline:${row.id}`,
    layer: 'DELIVERY_DEADLINES',
    title: row.name,
    startsAt: deadline.toISOString(),
    endsAt: deadline.toISOString(),
    isAllDay: true,
    description: `Product deadline - ${row.project.name}`,
    status: deadlineStatus(deadline, row.deliveryWorkStatus),
    sourceType: 'PRODUCT_DEADLINE',
    sourceId: row.id,
    sourceHref: `/projects/${row.projectId}/products/${row.id}`,
    badge: row.deliveryWorkStatus === 'ON_HOLD' ? 'On Hold' : 'Product',
    projectName: row.project.name,
    ownerName: row.pm ? `${row.pm.firstName} ${row.pm.lastName}` : null,
  };
}

export function extensionDeadlineProjection(row: ExtensionDeadlineRow): CalendarEventProjection {
  const deadline = row.deadline ?? new Date();
  return {
    id: `extension-deadline:${row.id}`,
    layer: 'DELIVERY_DEADLINES',
    title: row.name,
    startsAt: deadline.toISOString(),
    endsAt: deadline.toISOString(),
    isAllDay: true,
    description: `Extension for ${row.product.name} - ${row.project.name}`,
    status: deadlineStatus(deadline, row.deliveryWorkStatus),
    sourceType: 'EXTENSION_DEADLINE',
    sourceId: row.id,
    sourceHref: `/projects/${row.projectId}/extensions/${row.id}`,
    badge: row.deliveryWorkStatus === 'ON_HOLD' ? 'On Hold' : 'Extension',
    projectName: row.project.name,
    ownerName: row.assignee ? `${row.assignee.firstName} ${row.assignee.lastName}` : null,
  };
}

function deadlineStatus(deadline: Date, workStatus: string): string {
  if (workStatus === 'ON_HOLD') return 'ON_HOLD';
  const now = new Date();
  if (deadline < now) return 'OVERDUE';
  if (deadline.getTime() - now.getTime() <= APPROACHING_DEADLINE_DAYS * DAY_MS) {
    return 'APPROACHING';
  }
  return 'ON_TRACK';
}
