import type { Prisma } from '@nbos/database';
import { DOCUMENT_ACTIVITY_FIRST_PAGE_TAKE } from './documents.constants';

export const DOCUMENT_LIST_INCLUDE: Prisma.DocumentInclude = {
  section: {
    select: { id: true, name: true, slug: true, sortOrder: true, defaultListScope: true },
  },
  tagLinks: { include: { tag: { select: { id: true, name: true, slug: true } } } },
};

/** List rows when `search` is set: attachment file names feed snippet fallback. */
export const DOCUMENT_LIST_SEARCH_INCLUDE: Prisma.DocumentInclude = {
  ...DOCUMENT_LIST_INCLUDE,
  attachments: {
    select: {
      id: true,
      fileAsset: { select: { displayName: true, originalName: true } },
    },
  },
};

const documentDetailSectionSelect = {
  id: true,
  name: true,
  slug: true,
  sortOrder: true,
  defaultListScope: true,
} as const;

const documentDetailAttachmentsInclude = {
  orderBy: { sortOrder: 'asc' as const },
  include: {
    fileAsset: {
      select: {
        id: true,
        displayName: true,
        originalName: true,
        mimeType: true,
        fileType: true,
        sizeBytes: true,
      },
    },
  },
} as const;

/** Detail payload without activity (when `DOCUMENTS_VIEW_ACTIVITY` is NONE or missing with VIEW NONE). */
export const DOCUMENT_DETAIL_WITHOUT_ACTIVITY: Prisma.DocumentInclude = {
  section: { select: documentDetailSectionSelect },
  tagLinks: { include: { tag: true } },
  attachments: documentDetailAttachmentsInclude,
};

export const DOCUMENT_DETAIL_INCLUDE: Prisma.DocumentInclude = {
  ...DOCUMENT_DETAIL_WITHOUT_ACTIVITY,
  activityEvents: {
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: DOCUMENT_ACTIVITY_FIRST_PAGE_TAKE,
  },
};
