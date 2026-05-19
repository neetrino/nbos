const EXTENSION_BADGE_CLASS: Record<string, string> = {
  pdf: 'bg-red-600 text-white',
  doc: 'bg-blue-700 text-white',
  docx: 'bg-blue-700 text-white',
  xls: 'bg-emerald-700 text-white',
  xlsx: 'bg-emerald-700 text-white',
  png: 'bg-violet-600 text-white',
  jpg: 'bg-violet-600 text-white',
  jpeg: 'bg-violet-600 text-white',
  zip: 'bg-amber-700 text-white',
};

const DEFAULT_EXTENSION_BADGE_CLASS = 'bg-stone-700 text-white dark:bg-stone-600';

/** Uppercase extension label from a file display name (e.g. `Offer.pdf` → `PDF`). */
export function fileExtensionLabel(displayName: string): string {
  const segment = displayName.split('.').pop()?.trim();
  if (!segment || segment.length > 8) return 'FILE';
  return segment.toUpperCase();
}

export function fileExtensionBadgeClass(displayName: string): string {
  const key = displayName.split('.').pop()?.trim().toLowerCase() ?? '';
  return EXTENSION_BADGE_CLASS[key] ?? DEFAULT_EXTENSION_BADGE_CLASS;
}
