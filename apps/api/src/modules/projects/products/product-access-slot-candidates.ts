import type { Prisma, CredentialCategoryEnum } from '@nbos/database';

export const ACCESS_SLOT_CANDIDATE_PAGE_SIZE = 8;

export function pageAccessSlotCandidates<T>(
  rows: readonly T[],
  pageSize = ACCESS_SLOT_CANDIDATE_PAGE_SIZE,
): { items: T[]; hasMore: boolean } {
  return {
    items: rows.slice(0, pageSize),
    hasMore: rows.length > pageSize,
  };
}

export function buildAccessSlotCandidateWhere(input: {
  productProjectId: string;
  allowedCategories: readonly string[];
  excludeCredentialIds: string[];
  visibility: Prisma.CredentialWhereInput;
  search?: string;
}): Prisma.CredentialWhereInput {
  const needle = input.search?.trim();
  return {
    trashedAt: null,
    category: { in: [...input.allowedCategories] as CredentialCategoryEnum[] },
    id: { notIn: input.excludeCredentialIds },
    AND: [
      { OR: [{ projectId: input.productProjectId }, { projectId: null }] },
      input.visibility,
      needle
        ? {
            OR: [
              { name: { contains: needle, mode: 'insensitive' as const } },
              { login: { contains: needle, mode: 'insensitive' as const } },
            ],
          }
        : {},
    ],
  };
}
