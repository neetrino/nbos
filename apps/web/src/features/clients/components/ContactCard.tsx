'use client';

import { Building2, Briefcase, Handshake, Mail, Phone, Target } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import { getContactRole } from '@/features/clients/constants/clients';
import { CLIENTS_DIRECTORY_CARD_CLASS } from '@/features/clients/constants/clients-directory-card-classes';
import type { Contact } from '@/lib/api/clients';

interface ContactCardProps {
  contact: Contact;
  onOpen: (contact: Contact) => void;
}

function contactInitials(contact: Contact): string {
  const first = contact.firstName.trim()[0] ?? '';
  const last = contact.lastName.trim()[0] ?? '';
  return `${first}${last}`.toUpperCase() || '?';
}

function contactDisplayName(contact: Contact): string {
  return `${contact.firstName} ${contact.lastName}`.trim() || 'Contact';
}

export function ContactCard({ contact, onOpen }: ContactCardProps) {
  const role = getContactRole(contact.role);

  return (
    <button type="button" onClick={() => onOpen(contact)} className={CLIENTS_DIRECTORY_CARD_CLASS}>
      <div className="flex items-start gap-3">
        <div className="bg-accent/15 text-accent group-hover:bg-accent/20 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors">
          {contactInitials(contact)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{contactDisplayName(contact)}</p>
          {contact.companies.length > 0 ? (
            <p className="text-muted-foreground mt-0.5 flex items-center gap-1 truncate text-xs">
              <Building2 size={11} aria-hidden />
              {contact.companies.map((c) => c.name).join(', ')}
            </p>
          ) : (
            <p className="text-muted-foreground mt-0.5 text-xs">No linked companies</p>
          )}
        </div>
        {role && <StatusBadge label={role.label} variant={role.variant} />}
      </div>

      <div className="mt-4 space-y-1.5">
        {contact.phone && (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Phone size={12} aria-hidden />
            <span>{contact.phone}</span>
          </div>
        )}
        {contact.email && (
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Mail size={12} aria-hidden />
            <span className="truncate">{contact.email}</span>
          </div>
        )}
      </div>

      <div className="text-muted-foreground mt-4 flex flex-wrap gap-3 border-t pt-3 text-xs">
        <span className="flex items-center gap-1">
          <Briefcase size={11} aria-hidden />
          {contact._count.projects} projects
        </span>
        <span className="flex items-center gap-1">
          <Target size={11} aria-hidden />
          {contact._count.leads} leads
        </span>
        <span className="flex items-center gap-1">
          <Handshake size={11} aria-hidden />
          {contact._count.deals} deals
        </span>
      </div>
    </button>
  );
}
