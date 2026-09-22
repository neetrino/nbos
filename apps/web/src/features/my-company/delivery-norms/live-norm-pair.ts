export type LiveNormPair<T> = {
  key: string;
  published: T | null;
  draft: T | null;
};

export function liveNormPair<T extends { status: string }>(
  key: string,
  rows: readonly T[],
): LiveNormPair<T> {
  return {
    key,
    published: rows.find((row) => row.status === 'PUBLISHED') ?? null,
    draft: rows.find((row) => row.status === 'DRAFT') ?? null,
  };
}

export function liveNormDisplayStatus(pair: LiveNormPair<{ status: string }>): string {
  if (pair.draft) {
    return 'DRAFT';
  }
  if (pair.published) {
    return 'PUBLISHED';
  }
  return 'DRAFT';
}
