import type { InternalMessengerSectionId } from './internal-messenger.constants';
import { INTERNAL_MESSENGER_SECTIONS } from './internal-messenger.constants';

export function sectionFromPathname(pathname: string): InternalMessengerSectionId {
  const match = INTERNAL_MESSENGER_SECTIONS.find((section) => {
    if (section.href === '/messenger')
      return pathname === '/messenger' || pathname === '/messenger/';
    return pathname === section.href || pathname.startsWith(`${section.href}/`);
  });
  return match?.id ?? 'all';
}

export function conversationListTitle(
  type: string,
  title: string | null,
  peerName: string | null,
): string {
  if (type === 'DIRECT') return peerName?.trim() || title?.trim() || 'Direct';
  return title?.trim() || defaultTypeLabel(type);
}

function defaultTypeLabel(type: string): string {
  if (type === 'INTERNAL_GROUP') return 'Group';
  if (type === 'PRODUCT') return 'Product';
  if (type === 'TASK') return 'Task';
  if (type === 'DEAL') return 'Deal';
  if (type === 'PROJECT_GENERAL') return 'Project';
  return 'Conversation';
}

export function conversationTypeBadge(type: string): string {
  if (type === 'DIRECT') return 'Direct';
  if (type === 'INTERNAL_GROUP') return 'Group';
  if (type === 'PRODUCT') return 'Product';
  if (type === 'TASK') return 'Task';
  if (type === 'DEAL') return 'Deal';
  if (type === 'PROJECT_GENERAL') return 'Project';
  return 'Internal';
}
