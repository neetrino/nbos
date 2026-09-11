const GENERATED_CALL_PREFIXES = ['Incoming call', 'Outgoing call'] as const;
const GENERIC_TITLES = new Set(['New caller', 'Call']);

export function activeCallHeroTitle(contactName: string | null, displayName: string): string {
  const named = contactName?.trim();
  if (named) return named;
  if (isGeneratedCallTitle(displayName)) return 'New caller';
  return displayName;
}

export function activeCallHeroInitials(title: string): string | null {
  if (GENERIC_TITLES.has(title) || isGeneratedCallTitle(title)) return null;
  const parts = title.split(/\s+/).filter((part) => part.length > 0);
  const first = parts[0]?.[0];
  if (!first) return null;
  const second = parts.length > 1 ? (parts[1]?.[0] ?? '') : '';
  return `${first}${second}`.toUpperCase();
}

export function shouldShowHeroPhone(phone: string | null, displayName: string): boolean {
  if (!phone) return false;
  return displayName !== phone;
}

function isGeneratedCallTitle(title: string): boolean {
  return GENERATED_CALL_PREFIXES.some((prefix) => title.startsWith(prefix));
}
