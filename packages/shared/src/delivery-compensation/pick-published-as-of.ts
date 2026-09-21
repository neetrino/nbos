export type PublishedVersion<T> = T & {
  status: string;
  effectiveFrom: Date;
};

export function pickPublishedAsOf<T>(versions: readonly PublishedVersion<T>[], at: Date): T | null {
  const eligible = versions
    .filter((row) => row.status === 'PUBLISHED' && row.effectiveFrom.getTime() <= at.getTime())
    .sort((left, right) => right.effectiveFrom.getTime() - left.effectiveFrom.getTime());
  return eligible[0] ?? null;
}
