/**
 * HTML input props that suppress browser autofill and search history on module list
 * search fields (PageHero, IntegratedSearchFilters, FilterBar, etc.).
 */
export const LIST_SEARCH_INPUT_PROPS = {
  autoComplete: 'off',
  autoCorrect: 'off',
  autoCapitalize: 'off',
  spellCheck: false,
  'data-lpignore': 'true',
  'data-1p-ignore': 'true',
  'data-form-type': 'other',
} as const;
