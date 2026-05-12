/** ISO-like codes used with `Product.languages` and delivery UI ordering. */
export const PRODUCT_LANGUAGE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'hy', label: 'Armenian' },
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Russian' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'it', label: 'Italian' },
  { value: 'ar', label: 'Arabic' },
  { value: 'tr', label: 'Turkish' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
];

const PRIORITY = new Map(PRODUCT_LANGUAGE_OPTIONS.map((o, i) => [o.value, i]));

const LABEL_BY_VALUE = new Map(PRODUCT_LANGUAGE_OPTIONS.map((o) => [o.value, o.label]));

export function languageLabel(code: string): string {
  return LABEL_BY_VALUE.get(code) ?? code.toUpperCase();
}

/** hy, en, ru first (by option order), then remaining codes A–Z by label. */
export function sortLanguageCodesForDisplay(codes: string[]): string[] {
  const unique = Array.from(new Set(codes.map((c) => c.trim().toLowerCase()).filter(Boolean)));
  return unique.sort((a, b) => {
    const pa = PRIORITY.has(a) ? (PRIORITY.get(a) as number) : 999;
    const pb = PRIORITY.has(b) ? (PRIORITY.get(b) as number) : 999;
    if (pa !== pb) return pa - pb;
    return languageLabel(a).localeCompare(languageLabel(b), 'en');
  });
}
