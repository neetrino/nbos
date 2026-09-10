import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@nbos/database';

const LIST_CURSOR_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type MessengerListCursor = {
  lastMessageAt: Date | null;
  createdAt: Date;
  id: string;
};

export const MESSENGER_LIST_ORDER_BY = [
  { lastMessageAt: { sort: 'desc' as const, nulls: 'last' as const } },
  { createdAt: 'desc' as const },
  { id: 'desc' as const },
] satisfies Prisma.MessengerConversationOrderByWithRelationInput[];

export function takeListPagePlusOne(pageSize: number): number {
  return pageSize + 1;
}

export function sliceMessengerListPage<T>(rows: T[], pageSize: number): {
  items: T[];
  hasMore: boolean;
} {
  const hasMore = rows.length > pageSize;
  return { items: hasMore ? rows.slice(0, pageSize) : rows, hasMore };
}

export function messengerListContinuation(page: {
  items: MessengerListCursor[];
  hasMore: boolean;
}): { hasMore: boolean; nextCursor?: string } {
  const last = page.items[page.items.length - 1];
  if (!page.hasMore || !last) return { hasMore: page.hasMore };
  return { hasMore: true, nextCursor: encodeMessengerListCursor(last) };
}

export function encodeMessengerListCursor(row: MessengerListCursor): string {
  const last = row.lastMessageAt ? row.lastMessageAt.toISOString() : '';
  return `${last}|${row.createdAt.toISOString()}|${row.id}`;
}

export function parseMessengerListCursor(raw: string | undefined): MessengerListCursor | undefined {
  if (!raw?.trim()) return undefined;
  const parts = raw.split('|');
  if (parts.length !== 3) throw invalidCursor();
  const lastRaw = parts[0] ?? '';
  const createdRaw = parts[1] ?? '';
  const id = parts[2] ?? '';
  if (!LIST_CURSOR_UUID.test(id)) throw invalidCursor();
  const createdAt = new Date(createdRaw);
  if (Number.isNaN(createdAt.getTime())) throw invalidCursor();
  if (!lastRaw) return { lastMessageAt: null, createdAt, id };
  const lastMessageAt = new Date(lastRaw);
  if (Number.isNaN(lastMessageAt.getTime())) throw invalidCursor();
  return { lastMessageAt, createdAt, id };
}

export function prismaAfterListCursor(
  cursor: MessengerListCursor,
): Prisma.MessengerConversationWhereInput {
  if (cursor.lastMessageAt) {
    return {
      OR: [
        { lastMessageAt: { lt: cursor.lastMessageAt } },
        { lastMessageAt: null },
        { lastMessageAt: cursor.lastMessageAt, createdAt: { lt: cursor.createdAt } },
        {
          lastMessageAt: cursor.lastMessageAt,
          createdAt: cursor.createdAt,
          id: { lt: cursor.id },
        },
      ],
    };
  }
  return {
    lastMessageAt: null,
    OR: [
      { createdAt: { lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, id: { lt: cursor.id } },
    ],
  };
}

function invalidCursor(): BadRequestException {
  return new BadRequestException('Invalid list cursor');
}
