import type { Contact } from '@/lib/api/clients';
import type { Deal } from '@/lib/api/deals';
import type { Lead } from '@/lib/api/leads';
import type { Project } from '@/lib/api/projects';
import { getLeadMergeCandidateSubtitle, getLeadMergeCandidateTitle } from './lead-merge-wizard';
import { LEAD_SVYAZAT_RECENT_LIMIT } from './lead-svyazat-labels';

export interface SvyazatSearchHit {
  id: string;
  title: string;
  subtitle: string;
}

function isOpenDealStatus(status: string): boolean {
  return status !== 'WON' && status !== 'FAILED';
}

export function contactSvyazatTitle(contact: Pick<Contact, 'firstName' | 'lastName'>): string {
  return `${contact.firstName} ${contact.lastName}`.trim() || contact.firstName;
}

export function contactSvyazatSubtitle(contact: Pick<Contact, 'phone' | 'email'>): string {
  return [contact.phone, contact.email].filter(Boolean).join(' · ');
}

export function dealSvyazatTitle(deal: Pick<Deal, 'name' | 'code'>): string {
  return deal.name?.trim() || deal.code;
}

export function dealSvyazatSubtitle(deal: Pick<Deal, 'code' | 'name' | 'status'>): string {
  const parts = [deal.name?.trim() ? deal.code : null, deal.status.replace(/_/g, ' ')];
  return parts.filter(Boolean).join(' · ');
}

export function projectSvyazatTitle(project: Pick<Project, 'name' | 'code'>): string {
  return project.name.trim() || project.code;
}

export function projectSvyazatSubtitle(project: Pick<Project, 'code' | 'name'>): string {
  return project.name.trim() ? project.code : '';
}

export function leadSvyazatHit(lead: Lead): SvyazatSearchHit {
  const hit = {
    id: lead.id,
    code: lead.code,
    name: lead.name,
    contactName: lead.contactName,
    phone: lead.phone,
    email: lead.email,
    hasOpenDeal: Boolean(lead.deal && isOpenDealStatus(lead.deal.status)),
  };
  return {
    id: lead.id,
    title: getLeadMergeCandidateTitle(hit),
    subtitle: getLeadMergeCandidateSubtitle(hit),
  };
}

export function toContactHits(items: Contact[]): SvyazatSearchHit[] {
  return items.slice(0, LEAD_SVYAZAT_RECENT_LIMIT).map((contact) => ({
    id: contact.id,
    title: contactSvyazatTitle(contact),
    subtitle: contactSvyazatSubtitle(contact),
  }));
}

export function toOpenDealHits(items: Deal[]): SvyazatSearchHit[] {
  return items
    .filter((deal) => isOpenDealStatus(deal.status))
    .slice(0, LEAD_SVYAZAT_RECENT_LIMIT)
    .map((deal) => ({
      id: deal.id,
      title: dealSvyazatTitle(deal),
      subtitle: dealSvyazatSubtitle(deal),
    }));
}

export function toProjectHits(items: Project[]): SvyazatSearchHit[] {
  return items
    .filter((project) => !project.trashedAt)
    .slice(0, LEAD_SVYAZAT_RECENT_LIMIT)
    .map((project) => ({
      id: project.id,
      title: projectSvyazatTitle(project),
      subtitle: projectSvyazatSubtitle(project),
    }));
}

export function toLeadHits(items: Lead[], excludeId: string): SvyazatSearchHit[] {
  return items
    .filter(
      (lead) =>
        lead.id !== excludeId &&
        lead.status !== 'SQL' &&
        !lead.mergedIntoId &&
        !lead.trashedAt &&
        !lead.deal,
    )
    .slice(0, LEAD_SVYAZAT_RECENT_LIMIT)
    .map(leadSvyazatHit);
}
