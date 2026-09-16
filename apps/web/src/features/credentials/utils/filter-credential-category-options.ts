import type { CredentialCategoryOption } from '@/features/credentials/constants/credential-vault-categories';

const RANK_PREFIX = 0;
const RANK_WORD_PREFIX = 1;
const RANK_CONTAINS = 2;
const RANK_NONE = 3;
const WORD_SPLIT = /[\s_/.-]+/;

/**
 * Keep catalog matches, but rank prefix hits first (type "E" → ENV before Service).
 * Within the same rank the original catalog order is preserved.
 */
export function filterAndRankCredentialCategoryOptions(
  options: readonly CredentialCategoryOption[],
  query: string,
): CredentialCategoryOption[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...options];

  return options
    .map((option, index) => ({
      option,
      index,
      rank: categoryQueryRank(option, needle),
    }))
    .filter((row) => row.rank !== RANK_NONE)
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .map((row) => row.option);
}

function categoryQueryRank(option: CredentialCategoryOption, needle: string): number {
  const fields = [option.label, option.value].map((field) => field.toLowerCase());
  if (fields.some((field) => field.startsWith(needle))) return RANK_PREFIX;
  if (fields.some((field) => wordsOf(field).some((word) => word.startsWith(needle)))) {
    return RANK_WORD_PREFIX;
  }
  if (fields.some((field) => field.includes(needle))) return RANK_CONTAINS;
  return RANK_NONE;
}

function wordsOf(text: string): string[] {
  return text.split(WORD_SPLIT).filter(Boolean);
}
