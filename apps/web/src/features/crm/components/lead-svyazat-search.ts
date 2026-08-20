import type { Contact } from '@/lib/api/clients';
import type { Deal } from '@/lib/api/deals';
import type { Lead } from '@/lib/api/leads';
import type { Product } from '@/lib/api/products';
import type { Project } from '@/lib/api/projects';
import { getLeadMergeCandidateSubtitle, getLeadMergeCandidateTitle } from './lead-merge-wizard';
import { LEAD_SVYAZAT_RECENT_LIMIT } from './lead-svyazat-labels';

export type SvyazatSearchKind = 'contact' | 'deal' | 'project' | 'product' | 'lead';

export interface SvyazatSearchHit {
  id: string;
  kind: SvyazatSearchKind;
  title: string;
  subtitle: string;
}

export const SVYAZAT_KIND_LABELS: Record<SvyazatSearchKind, string> = {
  contact: 'Contact',
  deal: 'Deal',
  project: 'Project',
  product: 'Product',
  lead: 'Lead',
};

function isOpenDealStatus(status: string): boolean {
  return status !== 'WON' && status !== 'FAILED';
}

function contactTitle(contact: Pick<Contact, 'firstName' | 'lastName'>): string {
  return `${contact.firstName} ${contact.lastName}`.trim() || contact.firstName;
}

function contactSubtitle(contact: Pick<Contact, 'phone' | 'email'>): string {
  return [contact.phone, contact.email].filter(Boolean).join(' · ');
}

function dealTitle(deal: Pick<Deal, 'name' | 'code'>): string {
  return deal.name?.trim() || deal.code;
}

function dealSubtitle(deal: Pick<Deal, 'code' | 'name' | 'status'>): string {
  const parts = [deal.name?.trim() ? deal.code : null, deal.status.replace(/_/g, ' ')];
  return parts.filter(Boolean).join(' · ');
}

function projectTitle(project: Pick<Project, 'name' | 'code'>): string {
  return project.name.trim() || project.code;
}

function projectSubtitle(project: Pick<Project, 'code' | 'name'>): string {
  return project.name.trim() ? project.code : '';
}

function productTitle(product: Pick<Product, 'name'>): string {
  return product.name.trim() || 'Product';
}

function productSubtitle(product: Pick<Product, 'productType' | 'project'>): string {
  return [product.project?.name, product.productType.replace(/_/g, ' ')]
    .filter(Boolean)
    .join(' · ');
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
    kind: 'lead',
    title: getLeadMergeCandidateTitle(hit),
    subtitle: getLeadMergeCandidateSubtitle(hit),
  };
}

export function toContactHits(items: Contact[]): SvyazatSearchHit[] {
  return items.slice(0, LEAD_SVYAZAT_RECENT_LIMIT).map((contact) => ({
    id: contact.id,
    kind: 'contact',
    title: contactTitle(contact),
    subtitle: contactSubtitle(contact),
  }));
}

export function toOpenDealHits(items: Deal[]): SvyazatSearchHit[] {
  return items
    .filter((deal) => isOpenDealStatus(deal.status))
    .slice(0, LEAD_SVYAZAT_RECENT_LIMIT)
    .map((deal) => ({
      id: deal.id,
      kind: 'deal',
      title: dealTitle(deal),
      subtitle: dealSubtitle(deal),
    }));
}

export function toProjectHits(items: Project[]): SvyazatSearchHit[] {
  return items
    .filter((project) => !project.trashedAt)
    .slice(0, LEAD_SVYAZAT_RECENT_LIMIT)
    .map((project) => ({
      id: project.id,
      kind: 'project',
      title: projectTitle(project),
      subtitle: projectSubtitle(project),
    }));
}

export function toProductHits(items: Product[]): SvyazatSearchHit[] {
  return items.slice(0, LEAD_SVYAZAT_RECENT_LIMIT).map((product) => ({
    id: product.id,
    kind: 'product',
    title: productTitle(product),
    subtitle: productSubtitle(product),
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
