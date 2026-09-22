import type { CodeProductTypeOption } from './code-product-type-picker.types';

const RANK_NAME_PREFIX = 0;
const RANK_NAME_WORD_PREFIX = 1;
const RANK_NAME_CONTAINS = 2;
const RANK_DESCRIPTION_CONTAINS = 3;
const RANK_NONE = 4;
const WORD_SPLIT = /[\s_/.-]+/;

/**
 * Rank Code type cards: name (and enum code) first, description last.
 * Within a rank the original catalog order is preserved.
 */
export function filterAndRankCodeProductTypes(
  options: readonly CodeProductTypeOption[],
  query: string,
): CodeProductTypeOption[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...options];

  return options
    .map((option, index) => ({
      option,
      index,
      rank: codeProductTypeQueryRank(option, needle),
    }))
    .filter((row) => row.rank !== RANK_NONE)
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .map((row) => row.option);
}

function codeProductTypeQueryRank(option: CodeProductTypeOption, needle: string): number {
  const nameFields = [option.label, option.value].map((field) => field.toLowerCase());
  if (nameFields.some((field) => field.startsWith(needle))) return RANK_NAME_PREFIX;
  if (nameFields.some((field) => wordsOf(field).some((word) => word.startsWith(needle)))) {
    return RANK_NAME_WORD_PREFIX;
  }
  if (nameFields.some((field) => field.includes(needle))) return RANK_NAME_CONTAINS;
  if (option.description.toLowerCase().includes(needle)) return RANK_DESCRIPTION_CONTAINS;
  return RANK_NONE;
}

function wordsOf(text: string): string[] {
  return text.split(WORD_SPLIT).filter(Boolean);
}
