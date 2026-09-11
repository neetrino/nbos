import { isWhatsAppGroupChatId, normalizeWhatsAppGroupChatId } from '@nbos/shared';

/** Prefer an explicit list selection; otherwise accept a pasted/typed group JID. */
export function resolveDealWhatsAppBindId(
  search: string,
  selectedId?: string | null,
): string | null {
  const selected = selectedId?.trim();
  if (selected) return selected;
  const normalized = normalizeWhatsAppGroupChatId(search);
  return isWhatsAppGroupChatId(normalized) ? normalized : null;
}
