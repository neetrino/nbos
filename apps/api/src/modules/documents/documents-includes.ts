import type { Prisma } from '@nbos/database';
import { DOCUMENT_ACTIVITY_LIMIT } from './documents.constants';

export const DOCUMENT_LIST_INCLUDE: Prisma.DocumentInclude = {
  section: { select: { id: true, name: true, slug: true, sortOrder: true } },
};

export const DOCUMENT_DETAIL_INCLUDE: Prisma.DocumentInclude = {
  section: { select: { id: true, name: true, slug: true, sortOrder: true } },
  tagLinks: { include: { tag: true } },
  activityEvents: { orderBy: { createdAt: 'desc' }, take: DOCUMENT_ACTIVITY_LIMIT },
};
