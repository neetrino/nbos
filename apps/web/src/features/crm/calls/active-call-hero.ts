import type { useTranslations } from 'next-intl';

export type CrmCallsTranslate = ReturnType<typeof useTranslations<'crm'>>;

export const ACTIVE_CALL_NEW_CALLER_KEY = 'calls.newCaller';
export const ACTIVE_CALL_GENERIC_CALL_KEY = 'calls.call';

const GENERATED_CALL_PREFIXES = [
  'Incoming call',
  'Outgoing call',
  'Входящий',
  'Исходящий',
] as const;
const GENERIC_TITLE_KEYS = new Set<string>([
  ACTIVE_CALL_NEW_CALLER_KEY,
  ACTIVE_CALL_GENERIC_CALL_KEY,
]);
const GENERIC_DISPLAY_TITLES = new Set(['New caller', 'Call', 'Новый звонящий', 'Звонок']);

export function activeCallHeroTitle(contactName: string | null, displayName: string): string {
  const named = contactName?.trim();
  if (named) return named;
  if (isGeneratedCallTitle(displayName)) return ACTIVE_CALL_NEW_CALLER_KEY;
  return displayName;
}

export function activeCallHeroInitials(title: string): string | null {
  if (
    GENERIC_TITLE_KEYS.has(title) ||
    GENERIC_DISPLAY_TITLES.has(title) ||
    isGeneratedCallTitle(title)
  ) {
    return null;
  }
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

export function localizeCallMessageKey(t: CrmCallsTranslate, value: string): string {
  if (value.startsWith('calls.')) return t(value as never);
  return value;
}

function isGeneratedCallTitle(title: string): boolean {
  return GENERATED_CALL_PREFIXES.some((prefix) => title.startsWith(prefix));
}
