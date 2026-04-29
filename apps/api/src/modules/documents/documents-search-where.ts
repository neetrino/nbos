import type { Prisma } from '@nbos/database';

/**
 * Adds an AND-group with OR text match across title, description, plain text, section name and tag names.
 */
export function appendDocumentListTextSearch(
  where: Prisma.DocumentWhereInput,
  rawSearch: string,
): void {
  const term = rawSearch.trim();
  if (!term) return;

  const mode = 'insensitive' as const;
  const searchGroup: Prisma.DocumentWhereInput = {
    OR: [
      { title: { contains: term, mode } },
      { description: { contains: term, mode } },
      { plainText: { contains: term, mode } },
      { section: { name: { contains: term, mode } } },
      { tagLinks: { some: { tag: { name: { contains: term, mode } } } } },
    ],
  };

  const existingAnd = where.AND;
  const andList = !existingAnd
    ? [searchGroup]
    : Array.isArray(existingAnd)
      ? [...existingAnd, searchGroup]
      : [existingAnd, searchGroup];
  where.AND = andList;
}
