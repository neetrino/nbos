/**
 * Cards that were replaced by a single card with gradations. They were seeded as drafts, so removing
 * them costs nothing; keeping them would offer a PM two ways to sell the same work.
 */
export const SUPERSEDED_FUNCTION_CODES = [
  'CNT_MULTILINGUAL_LANDING',
  'CNT_MULTILINGUAL_CONTENT_SITE',
  'CNT_MULTILINGUAL_SYSTEM',
  'SRV_CATALOG_IMPORT_SMALL',
  'SRV_CATALOG_IMPORT_MEDIUM',
  'SRV_CATALOG_IMPORT_LARGE',
] as const;

export type CleanupCandidate = {
  id: string;
  code: string;
  status: string;
  featureCount: number;
  publishedPriceCount: number;
};

export type CleanupVerdict =
  | { action: 'DELETE'; candidate: CleanupCandidate }
  | { action: 'KEEP'; candidate: CleanupCandidate; reason: string };

/**
 * A card is removable only while it is nothing but a draft proposal: still DRAFT, never selected on a
 * product, and without a published unit version. Anything else is history or money and stays.
 */
export function planSupersededCleanup(candidates: readonly CleanupCandidate[]): CleanupVerdict[] {
  return candidates.map((candidate) => {
    const reason = keepReason(candidate);
    return reason ? { action: 'KEEP', candidate, reason } : { action: 'DELETE', candidate };
  });
}

function keepReason(candidate: CleanupCandidate): string | null {
  if (candidate.status !== 'DRAFT') {
    return `status is ${candidate.status}, not a draft`;
  }
  if (candidate.featureCount > 0) {
    return `selected on ${candidate.featureCount} product configuration(s)`;
  }
  if (candidate.publishedPriceCount > 0) {
    return 'has a published unit version';
  }
  return null;
}

export function formatCleanupPlan(verdicts: readonly CleanupVerdict[], apply: boolean): string {
  const deletions = verdicts.filter((verdict) => verdict.action === 'DELETE').length;
  const header = apply
    ? `Removing ${deletions} superseded draft card(s).`
    : `Dry run. ${deletions} superseded draft card(s) would be removed.`;
  const lines = verdicts.map((verdict) =>
    verdict.action === 'DELETE'
      ? `  DELETE ${verdict.candidate.code}`
      : `  KEEP   ${verdict.candidate.code} — ${verdict.reason}`,
  );
  return [header, ...lines].join('\n');
}
