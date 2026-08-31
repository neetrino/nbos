export const CLIENT_MESSENGER_SECTIONS = [
  { id: 'inbox', label: 'Inbox', href: '/client-messenger' },
  { id: 'sales', label: 'Sales', href: '/client-messenger/sales' },
  { id: 'clients', label: 'Clients', href: '/client-messenger/clients' },
  { id: 'collections', label: 'Collections', href: '/client-messenger/collections' },
] as const;

export type ClientMessengerSectionId = (typeof CLIENT_MESSENGER_SECTIONS)[number]['id'];

export const CLIENT_MESSENGER_EMPTY_COPY: Record<ClientMessengerSectionId, string> = {
  inbox: 'No Client conversations yet. Mapped Meta Sales appear here after mapping.',
  sales: 'No Sales conversations yet. Meta Instagram/Facebook history maps into this view.',
  clients:
    'No existing-client conversations yet. Product client chats arrive with later WhatsApp cutover.',
  collections: 'No Client collections yet. Favorites is created automatically.',
};

export const CLIENT_MESSENGER_SHELL_CLASS =
  'flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-teal-900/15 bg-[#F4F7F7]';

export const CLIENT_MESSENGER_ACCENT_CLASS = 'text-teal-800';
export const CLIENT_MESSENGER_ACCENT_BG_CLASS = 'bg-teal-800/10';
export const CLIENT_VISIBLE_LABEL = 'CLIENT VISIBLE';
export const CLIENT_REPLY_LABEL = 'Reply to client';
export const INTERNAL_COMPOSER_DRAFT_STORE_KEY = 'nbos:internal-messenger:draft';
export const CLIENT_COMPOSER_DRAFT_STORE_KEY = 'nbos:client-messenger:draft';
export const CLIENT_OPEN_CONVERSATION_QUERY = 'conversation';
