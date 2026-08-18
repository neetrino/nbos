import type { Prisma } from '@nbos/database';

export interface DealListResponsibilityQuery {
  sellerId?: string;
  sellerAssistantId?: string;
  involvedEmployeeId?: string;
}

function appendAndClause(
  where: Prisma.DealWhereInput,
  clause: Prisma.DealWhereInput,
): Prisma.DealWhereInput {
  const existingAnd = where.AND;
  if (Array.isArray(existingAnd)) {
    where.AND = [...existingAnd, clause];
    return where;
  }
  if (existingAnd) {
    where.AND = [existingAnd, clause];
    return where;
  }
  where.AND = [clause];
  return where;
}

/**
 * Seller / assistant list filters. `involvedEmployeeId` is seller OR assistant
 * and composes with search `OR` via `AND`.
 */
export function applyDealListResponsibilityWhere(
  where: Prisma.DealWhereInput,
  query: DealListResponsibilityQuery,
): Prisma.DealWhereInput {
  const sellerId = query.sellerId?.trim();
  const sellerAssistantId = query.sellerAssistantId?.trim();
  const involvedEmployeeId = query.involvedEmployeeId?.trim();

  if (sellerId) where.sellerId = sellerId;
  if (sellerAssistantId) where.sellerAssistantId = sellerAssistantId;
  if (!involvedEmployeeId) return where;

  return appendAndClause(where, {
    OR: [{ sellerId: involvedEmployeeId }, { sellerAssistantId: involvedEmployeeId }],
  });
}
