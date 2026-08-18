const GROUP_JID_SUFFIX = '@g.us';
const RAW_WA_GROUP_ID_PATTERN = /^\d{10,}(-\d+)?$/;

/**
 * Normalize a pasted WhatsApp group id. Bare numeric (or `digits-digits`) ids
 * get `@g.us` appended. Already-suffixed ids are trimmed only.
 */
export function normalizeWhatsAppGroupChatId(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (trimmed.endsWith(GROUP_JID_SUFFIX)) return trimmed;
  if (RAW_WA_GROUP_ID_PATTERN.test(trimmed)) {
    return `${trimmed}${GROUP_JID_SUFFIX}`;
  }
  return trimmed;
}

export function isWhatsAppGroupChatId(value: string): boolean {
  return normalizeWhatsAppGroupChatId(value).endsWith(GROUP_JID_SUFFIX);
}
