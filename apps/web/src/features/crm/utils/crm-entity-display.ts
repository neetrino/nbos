import type { Deal } from '@/lib/api/deals';
import type { Lead, LeadMetaConversation } from '@/lib/api/leads';

/** Primary kanban / sheet title — inquiry or deal name, not contact. */
export function getDealDisplayTitle(deal: Pick<Deal, 'name' | 'code'>): string {
  return deal.name?.trim() || deal.code;
}

export function getDealContactName(deal: Pick<Deal, 'contact'>): string | null {
  if (!deal.contact) return null;
  const name = `${deal.contact.firstName} ${deal.contact.lastName}`.trim();
  return name || null;
}

/** Secondary line on cards (contact, or company when no contact). */
export function getDealCardMetaLabel(deal: Pick<Deal, 'contact' | 'company'>): string | null {
  return getDealContactName(deal) ?? deal.company?.name ?? null;
}

const INSTAGRAM_GENERIC_TITLES = new Set(['Instagram DM', 'Instagram user', 'Instagram']);
const FACEBOOK_GENERIC_TITLES = new Set(['Facebook Messenger', 'Facebook user']);

function formatInstagramUsername(username: string | null | undefined): string | null {
  const trimmed = username?.trim();
  if (!trimmed) return null;
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

function isGenericMetaLeadName(
  value: string | null | undefined,
  platform: LeadMetaConversation['platform'],
): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return true;
  if (platform === 'INSTAGRAM') {
    return (
      INSTAGRAM_GENERIC_TITLES.has(trimmed) ||
      trimmed.startsWith('Instagram DM — @') ||
      trimmed.startsWith('Instagram DM - @')
    );
  }
  return (
    FACEBOOK_GENERIC_TITLES.has(trimmed) ||
    trimmed.startsWith('Facebook Messenger — ') ||
    trimmed.startsWith('Facebook Messenger - ')
  );
}

function buildMetaDisplayTitle(meta: LeadMetaConversation): string {
  if (meta.platform === 'INSTAGRAM') {
    return meta.displayName?.trim() || formatInstagramUsername(meta.username) || 'Instagram user';
  }
  const fullName = [meta.firstName?.trim(), meta.lastName?.trim()].filter(Boolean).join(' ');
  return fullName || meta.displayName?.trim() || 'Facebook user';
}

function buildMetaSubtitle(meta: LeadMetaConversation): string | null {
  if (meta.platform === 'INSTAGRAM') {
    return formatInstagramUsername(meta.username) || meta.displayName?.trim() || 'Instagram';
  }
  return 'Facebook Messenger';
}

export function getLeadDisplayTitle(
  lead: Pick<Lead, 'name' | 'code' | 'metaConversation'>,
): string {
  const meta = lead.metaConversation;
  if (meta && isGenericMetaLeadName(lead.name, meta.platform)) {
    return buildMetaDisplayTitle(meta);
  }
  return lead.name?.trim() || lead.code;
}

export function getLeadCardMetaLabel(
  lead: Pick<Lead, 'name' | 'contactName' | 'code' | 'metaConversation'>,
): string | null {
  const meta = lead.metaConversation;
  if (meta) {
    const subtitle = buildMetaSubtitle(meta);
    const title = getLeadDisplayTitle(lead);
    if (subtitle && subtitle !== title) {
      return subtitle;
    }
    return subtitle;
  }
  const title = getLeadDisplayTitle(lead);
  const contact = lead.contactName?.trim();
  if (contact && contact !== title) return contact;
  return null;
}

export function getLeadLatestMessagePreview(lead: Pick<Lead, 'metaConversation'>): string | null {
  return lead.metaConversation?.latestMessagePreview?.trim() || null;
}

export function getLeadMetaPlatformLabel(lead: Pick<Lead, 'metaConversation'>): string | null {
  if (!lead.metaConversation) return null;
  return lead.metaConversation.platform === 'INSTAGRAM' ? 'Instagram' : 'Facebook';
}
