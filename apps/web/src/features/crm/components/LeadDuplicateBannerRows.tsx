'use client';

import { Button } from '@/components/ui/button';
import type {
  LeadDuplicateCandidate,
  LeadDuplicateContact,
  LeadDuplicateLookupResult,
  LeadDuplicateOpenDeal,
} from '@/lib/api/leads';
import type { LeadDuplicateBannerMode } from './LeadDuplicateBanner';

interface LeadCandidateListProps {
  result: LeadDuplicateLookupResult;
  mode: LeadDuplicateBannerMode;
  showAttach: boolean;
  attaching: boolean;
  onOpen: (leadId: string) => void;
  onMerge?: (leadId: string) => void;
  onOpenContact?: (contactId: string) => void;
  onAttachContact?: (contactId: string, aboutDealId?: string) => void;
  onOpenDeal?: (dealId: string) => void;
}

export function LeadCandidateList(props: LeadCandidateListProps) {
  return (
    <ul className="space-y-2">
      {props.result.leads.map((lead) => (
        <LeadCandidateRow
          key={lead.id}
          lead={lead}
          mode={props.mode}
          onOpen={props.onOpen}
          onMerge={props.onMerge}
        />
      ))}
      {props.result.contacts.map((contact) => (
        <ContactCandidateRow
          key={contact.id}
          contact={contact}
          openDeal={openDealForContact(props.result.openDeals, contact.id)}
          showAttach={props.showAttach}
          attaching={props.attaching}
          onOpenContact={props.onOpenContact}
          onAttachContact={props.onAttachContact}
          onOpenDeal={props.onOpenDeal}
        />
      ))}
      {orphanOpenDeals(props.result).map((deal) => (
        <OrphanDealRow
          key={deal.id}
          deal={deal}
          showAttach={props.showAttach}
          attaching={props.attaching}
          onOpenDeal={props.onOpenDeal}
          onAttachContact={props.onAttachContact}
        />
      ))}
    </ul>
  );
}

function LeadCandidateRow(props: {
  lead: LeadDuplicateCandidate;
  mode: LeadDuplicateBannerMode;
  onOpen: (leadId: string) => void;
  onMerge?: (leadId: string) => void;
}) {
  const { lead } = props;
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white/70 px-2 py-1.5">
      <div className="min-w-0">
        <p className="truncate font-medium">
          {lead.code}
          {lead.name ? ` · ${lead.name}` : ''}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {lead.contactName}
          {lead.status === 'SPAM' ? ' · Spam (not auto-attached)' : ''}
          {lead.hasOpenDeal && lead.deal ? ` · Deal ${lead.deal.code}` : ''}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Button type="button" size="sm" variant="outline" onClick={() => props.onOpen(lead.id)}>
          Open
        </Button>
        {props.mode === 'create' ? (
          <Button type="button" size="sm" variant="secondary" onClick={() => props.onOpen(lead.id)}>
            Attach
          </Button>
        ) : null}
        {props.mode === 'phone-add' &&
        props.onMerge &&
        lead.isOpenForAttach &&
        !lead.hasOpenDeal ? (
          <Button type="button" size="sm" onClick={() => props.onMerge?.(lead.id)}>
            Merge
          </Button>
        ) : null}
      </div>
    </li>
  );
}

function ContactCandidateRow(props: {
  contact: LeadDuplicateContact;
  openDeal: LeadDuplicateOpenDeal | null;
  showAttach: boolean;
  attaching: boolean;
  onOpenContact?: (contactId: string) => void;
  onAttachContact?: (contactId: string, aboutDealId?: string) => void;
  onOpenDeal?: (dealId: string) => void;
}) {
  const name = `${props.contact.firstName} ${props.contact.lastName}`.trim();
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white/70 px-2 py-1.5">
      <div className="min-w-0">
        <p className="truncate font-medium">{name}</p>
        <p className="text-muted-foreground truncate text-xs">
          Contact
          {props.contact.phone ? ` · ${props.contact.phone}` : ''}
          {props.openDeal ? ` · open Deal ${props.openDeal.code}` : ''}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {props.onOpenContact ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => props.onOpenContact?.(props.contact.id)}
          >
            Open contact
          </Button>
        ) : null}
        {props.openDeal && props.onOpenDeal ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => props.onOpenDeal?.(props.openDeal?.id ?? '')}
          >
            Open Deal
          </Button>
        ) : null}
        {props.openDeal && props.showAttach ? (
          <Button
            type="button"
            size="sm"
            disabled={props.attaching}
            onClick={() => props.onAttachContact?.(props.contact.id, props.openDeal?.id)}
          >
            Это про эту сделку
          </Button>
        ) : null}
      </div>
    </li>
  );
}

function OrphanDealRow(props: {
  deal: LeadDuplicateOpenDeal;
  showAttach: boolean;
  attaching: boolean;
  onOpenDeal?: (dealId: string) => void;
  onAttachContact?: (contactId: string, aboutDealId?: string) => void;
}) {
  const canAbout = Boolean(props.deal.contactId && props.showAttach && props.onAttachContact);
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white/70 px-2 py-1.5">
      <div className="min-w-0">
        <p className="truncate font-medium">
          {props.deal.code}
          {props.deal.name ? ` · ${props.deal.name}` : ''}
        </p>
        <p className="text-muted-foreground truncate text-xs">Open Deal</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {props.onOpenDeal ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => props.onOpenDeal?.(props.deal.id)}
          >
            Open Deal
          </Button>
        ) : null}
        {canAbout ? (
          <Button
            type="button"
            size="sm"
            disabled={props.attaching}
            onClick={() => props.onAttachContact?.(props.deal.contactId ?? '', props.deal.id)}
          >
            Это про эту сделку
          </Button>
        ) : null}
      </div>
    </li>
  );
}

function openDealForContact(
  deals: LeadDuplicateOpenDeal[],
  contactId: string,
): LeadDuplicateOpenDeal | null {
  return deals.find((deal) => deal.contactId === contactId) ?? null;
}

function orphanOpenDeals(result: LeadDuplicateLookupResult): LeadDuplicateOpenDeal[] {
  const shown = new Set(result.contacts.map((contact) => contact.id));
  return result.openDeals.filter((deal) => !deal.contactId || !shown.has(deal.contactId));
}
