import type { ProductAccessSlotCandidate } from './products';

export type AccessSlotCandidatePage = {
  items: ProductAccessSlotCandidate[];
  hasMore: boolean;
};

function isCandidate(row: unknown): row is ProductAccessSlotCandidate {
  if (!row || typeof row !== 'object') return false;
  return typeof (row as ProductAccessSlotCandidate).id === 'string';
}

/** Accepts the paged DTO or a legacy bare array from an older API process. */
export function normalizeAccessSlotCandidatePage(payload: unknown): AccessSlotCandidatePage {
  if (Array.isArray(payload)) {
    return { items: payload.filter(isCandidate), hasMore: false };
  }
  if (!payload || typeof payload !== 'object') {
    return { items: [], hasMore: false };
  }
  const page = payload as { items?: unknown; hasMore?: unknown };
  return {
    items: Array.isArray(page.items) ? page.items.filter(isCandidate) : [],
    hasMore: page.hasMore === true,
  };
}
