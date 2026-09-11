import type { ClientMessengerSectionId } from './client-messenger.constants';
import { CLIENT_MESSENGER_SECTIONS } from './client-messenger.constants';

export function clientSectionFromPathname(pathname: string): ClientMessengerSectionId {
  const match = CLIENT_MESSENGER_SECTIONS.find((section) => {
    if (section.href === '/client-messenger') {
      return pathname === '/client-messenger' || pathname === '/client-messenger/';
    }
    return pathname === section.href || pathname.startsWith(`${section.href}/`);
  });
  return match?.id ?? 'inbox';
}

export function clientConversationTitle(
  title: string | null,
  provider: string | null | undefined,
): string {
  const name = title?.trim();
  if (name) return name;
  if (provider === 'INSTAGRAM') return 'Instagram conversation';
  if (provider === 'FACEBOOK') return 'Facebook conversation';
  if (provider === 'WHATSAPP') return 'WhatsApp conversation';
  return 'Client conversation';
}

export function clientProviderLabel(provider: string | null | undefined): string {
  if (provider === 'INSTAGRAM') return 'Instagram';
  if (provider === 'FACEBOOK') return 'Facebook';
  if (provider === 'WHATSAPP') return 'WhatsApp';
  return 'External';
}
