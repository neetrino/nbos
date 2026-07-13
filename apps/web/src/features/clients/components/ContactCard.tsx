'use client';

import type { LucideIcon } from 'lucide-react';
import { Briefcase, Handshake, Mail, Phone, Target, User } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import { getContactRole } from '@/features/clients/constants/clients';
import {
  CONTACT_DIRECTORY_CARD_CLASS,
  CONTACT_CARD_AVATAR_CLASS,
  CONTACT_CARD_CONTACT_ICON_TILE_CLASS,
  CONTACT_CARD_METRIC_CELL_CLASS,
  CONTACT_CARD_METRIC_ICON_TILE_CLASS,
  CONTACT_CARD_ROLE_BADGE_CLASS,
} from '@/features/clients/constants/clients-directory-card-classes';
import type { Contact } from '@/lib/api/clients';

interface ContactCardProps {
  contact: Contact;
  onOpen: (contact: Contact) => void;
}

interface ContactCardMetricProps {
  icon: LucideIcon;
  value: number;
  label: string;
}

interface ContactCardContactRowProps {
  icon: LucideIcon;
  value: string;
}

function contactInitials(contact: Contact): string {
  const first = contact.firstName.trim()[0] ?? '';
  const last = contact.lastName.trim()[0] ?? '';
  return `${first}${last}`.toUpperCase() || '?';
}

function contactDisplayName(contact: Contact): string {
  return `${contact.firstName} ${contact.lastName}`.trim() || 'Contact';
}

function ContactCardContactRow({ icon: Icon, value }: ContactCardContactRowProps) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className={CONTACT_CARD_CONTACT_ICON_TILE_CLASS} aria-hidden>
        <Icon size={15} />
      </div>
      <span className="text-foreground truncate text-sm">{value}</span>
    </div>
  );
}

function ContactCardMetric({ icon: Icon, value, label }: ContactCardMetricProps) {
  return (
    <div className={CONTACT_CARD_METRIC_CELL_CLASS}>
      <div className={CONTACT_CARD_METRIC_ICON_TILE_CLASS} aria-hidden>
        <Icon size={14} />
      </div>
      <p className="text-foreground text-base leading-none font-bold tabular-nums">{value}</p>
      <p className="text-muted-foreground text-[11px] leading-none">{label}</p>
    </div>
  );
}

export function ContactCard({ contact, onOpen }: ContactCardProps) {
  const role = getContactRole(contact.role);
  const companiesLabel =
    contact.companies.length > 0
      ? contact.companies.map((c) => c.name).join(', ')
      : 'No linked companies';

  return (
    <button type="button" onClick={() => onOpen(contact)} className={CONTACT_DIRECTORY_CARD_CLASS}>
      <div className="flex flex-col items-center text-center">
        <div className={CONTACT_CARD_AVATAR_CLASS} aria-hidden>
          {contactInitials(contact)}
        </div>
        <h3 className="text-foreground mt-3 max-w-full truncate text-base font-bold tracking-tight">
          {contactDisplayName(contact)}
        </h3>
        {role ? (
          <StatusBadge
            label={role.label}
            variant={role.variant}
            icon={<User size={12} aria-hidden />}
            className={`mt-2 self-center ${CONTACT_CARD_ROLE_BADGE_CLASS}`}
          />
        ) : null}
        <p className="text-muted-foreground mt-2 max-w-full truncate text-xs">{companiesLabel}</p>
      </div>

      {contact.phone || contact.email ? (
        <div className="mt-5 space-y-2.5">
          {contact.phone ? <ContactCardContactRow icon={Phone} value={contact.phone} /> : null}
          {contact.email ? <ContactCardContactRow icon={Mail} value={contact.email} /> : null}
        </div>
      ) : null}

      <div className="border-border mt-5 flex gap-2 border-t pt-4">
        <ContactCardMetric icon={Briefcase} value={contact._count.projects} label="projects" />
        <ContactCardMetric icon={Target} value={contact._count.leads} label="leads" />
        <ContactCardMetric icon={Handshake} value={contact._count.deals} label="deals" />
      </div>
    </button>
  );
}
