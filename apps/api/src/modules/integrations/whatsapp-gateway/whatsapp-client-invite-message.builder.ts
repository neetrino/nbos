export type WhatsAppInviteLocale = 'hy' | 'ru' | 'en';

export interface WhatsAppClientInviteMessageInput {
  clientName: string;
  productName: string;
  inviteUrl: string;
  locale?: string | null;
}

/**
 * Builds client WhatsApp invite text. Invite URL is accepted in-memory only — callers must not persist it.
 */
export function buildWhatsAppClientInviteMessage(input: WhatsAppClientInviteMessageInput): {
  locale: WhatsAppInviteLocale;
  text: string;
} {
  const locale = resolveInviteLocale(input.locale);
  const clientName =
    input.clientName.trim() ||
    (locale === 'en' ? 'partner' : locale === 'ru' ? 'клиент' : 'գործընկեր');
  const productName =
    input.productName.trim() ||
    (locale === 'en' ? 'product' : locale === 'ru' ? 'продукт' : 'արտադրանք');
  const inviteUrl = input.inviteUrl.trim();

  if (locale === 'en') {
    return {
      locale,
      text: `Hello, ${clientName}.\n\nA dedicated WhatsApp group has been created to discuss the product "${productName}".\n\nJoin:\n${inviteUrl}`,
    };
  }
  if (locale === 'ru') {
    return {
      locale,
      text: `Здравствуйте, ${clientName}.\n\nДля обсуждения продукта «${productName}» создана отдельная WhatsApp-группа.\n\nПрисоединиться:\n${inviteUrl}`,
    };
  }
  return {
    locale: 'hy',
    text: `Բարև Ձեզ, ${clientName}.\n\n«${productName}» արտադրանքի քննարկման համար ստեղծվել է առանձին WhatsApp խումբ։\n\nՄիանալ՝\n${inviteUrl}`,
  };
}

/** Contact language if set; otherwise Armenian. Not subscription reminderLanguage. */
export function resolveInviteLocale(raw: string | null | undefined): WhatsAppInviteLocale {
  const value = (raw ?? '').trim().toLowerCase();
  if (value.startsWith('hy') || value === 'armenian' || value === 'arm') return 'hy';
  if (value.startsWith('en') || value === 'english') return 'en';
  if (value.startsWith('ru') || value === 'russian') return 'ru';
  return 'hy';
}

export function extractContactLanguage(messengerLinks: unknown): string | null {
  if (!messengerLinks || typeof messengerLinks !== 'object') return null;
  const language = (messengerLinks as Record<string, unknown>).language;
  return typeof language === 'string' ? language : null;
}
