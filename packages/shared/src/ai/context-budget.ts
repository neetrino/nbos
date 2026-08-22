import {
  AI_CONTEXT_DEFAULT_MAX_CHARS,
  AI_CONTEXT_DEFAULT_MAX_FRAGMENTS,
  type AiAssembledContext,
  type AiContextBudget,
  type AiContextFragment,
} from './context-types';

export function resolveContextBudget(budget?: Partial<AiContextBudget>): AiContextBudget {
  return {
    maxFragments: budget?.maxFragments ?? AI_CONTEXT_DEFAULT_MAX_FRAGMENTS,
    maxChars: budget?.maxChars ?? AI_CONTEXT_DEFAULT_MAX_CHARS,
    maxAgeMs: budget?.maxAgeMs,
  };
}

export function measureProjectionChars(projection: Record<string, unknown>): number {
  return JSON.stringify(projection).length;
}

/**
 * Keep trusted config first, then freshest remaining fragments, within budget.
 */
export function applyContextBudget(
  fragments: AiContextFragment[],
  budget: AiContextBudget,
): Pick<AiAssembledContext, 'fragments' | 'omitted' | 'budget'> {
  const ranked = [...fragments].sort(compareContextPriority);
  const kept: AiContextFragment[] = [];
  const omitted: AiAssembledContext['omitted'] = [];
  let usedChars = 0;

  for (const fragment of ranked) {
    const size = measureProjectionChars(fragment.projection);
    const overCount = kept.length >= budget.maxFragments;
    const overChars = usedChars + size > budget.maxChars;
    if (overCount || overChars) {
      omitted.push({
        sourceId: fragment.sourceId,
        sourceType: fragment.sourceType,
        reason: 'BUDGET',
      });
      continue;
    }
    kept.push(fragment);
    usedChars += size;
  }

  return {
    fragments: kept,
    omitted,
    budget: {
      usedFragments: kept.length,
      usedChars,
      maxChars: budget.maxChars,
      truncated: omitted.length > 0,
    },
  };
}

function compareContextPriority(left: AiContextFragment, right: AiContextFragment): number {
  const trustRank =
    Number(left.classification.trust === 'UNTRUSTED_CONTENT') -
    Number(right.classification.trust === 'UNTRUSTED_CONTENT');
  if (trustRank !== 0) {
    return trustRank;
  }
  return right.freshness.retrievedAt.localeCompare(left.freshness.retrievedAt);
}
