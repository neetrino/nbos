'use client';

import {
  Building2,
  Calendar,
  FolderKanban,
  Handshake,
  Mail,
  MessageCircle,
  Phone,
  User,
} from 'lucide-react';
import { DetailSheetSection, InlineField } from '@/components/shared';
import { CONTACT_ROLES, LANGUAGES, PREFERRED_CHANNELS } from '../constants/clients';
import type { Contact } from '@/lib/api/clients';
import type { ContactGeneralDraft } from './contact-general-form-state';

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export interface ContactSheetScrollBodyProps {
  contact: Contact;
  draft: ContactGeneralDraft;
  patchDraft: (partial: Partial<ContactGeneralDraft>) => void;
  saving: boolean;
  generalError: string | null;
}

export function ContactSheetScrollBody({
  contact,
  draft,
  patchDraft,
  saving,
  generalError,
}: ContactSheetScrollBodyProps) {
  const roleOptions = CONTACT_ROLES.map((r) => ({ value: r.value, label: r.label }));
  const channelOptions = PREFERRED_CHANNELS.map((c) => ({ value: c.value, label: c.label }));
  const languageOptions = LANGUAGES.map((l) => ({ value: l.value, label: l.label }));

  return (
    <div className="space-y-6 px-7 py-5">
      {generalError ? (
        <p className="text-destructive text-center text-sm" role="alert">
          {generalError}
        </p>
      ) : null}

      <DetailSheetSection title="Contact info" icon={<User size={12} />}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <InlineField
            variant="controlled"
            label="First name"
            type="text"
            value={draft.firstName}
            placeholder="First name"
            icon={<User size={12} />}
            disabled={saving}
            onValueChange={(v) => patchDraft({ firstName: v })}
          />
          <InlineField
            variant="controlled"
            label="Last name"
            type="text"
            value={draft.lastName}
            placeholder="Last name"
            icon={<User size={12} />}
            disabled={saving}
            onValueChange={(v) => patchDraft({ lastName: v })}
          />
          <InlineField
            variant="controlled"
            label="Phone"
            type="phone"
            value={draft.phone}
            placeholder="+374…"
            icon={<Phone size={12} />}
            disabled={saving}
            onValueChange={(v) => patchDraft({ phone: v })}
          />
          <InlineField
            variant="controlled"
            label="Email"
            type="email"
            value={draft.email}
            placeholder="email@…"
            icon={<Mail size={12} />}
            disabled={saving}
            onValueChange={(v) => patchDraft({ email: v })}
          />
        </div>
      </DetailSheetSection>

      <DetailSheetSection title="Details" icon={<User size={12} />}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <InlineField
            variant="controlled"
            label="Contact type"
            type="select"
            value={draft.role}
            options={roleOptions}
            icon={<User size={12} />}
            disabled={saving}
            onValueChange={(v) => {
              if (v) patchDraft({ role: v });
            }}
          />
          <InlineField
            variant="controlled"
            label="Preferred channel"
            type="select"
            value={draft.preferredChannel}
            options={channelOptions}
            placeholder="Select…"
            clearable
            icon={<Phone size={12} />}
            disabled={saving}
            onValueChange={(v) => patchDraft({ preferredChannel: v })}
          />
          <InlineField
            variant="controlled"
            label="Language"
            type="select"
            value={draft.language}
            options={languageOptions}
            placeholder="Select…"
            clearable
            icon={<User size={12} />}
            disabled={saving}
            onValueChange={(v) => patchDraft({ language: v })}
          />
          <InlineField
            label="Created"
            value={formatShortDate(contact.createdAt)}
            icon={<Calendar size={12} />}
            editable={false}
          />
        </div>
      </DetailSheetSection>

      <DetailSheetSection title="Messengers" icon={<MessageCircle size={12} />}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <InlineField
            variant="controlled"
            label="WhatsApp"
            type="text"
            value={draft.whatsapp}
            placeholder="+374…"
            icon={<Phone size={12} />}
            disabled={saving}
            onValueChange={(v) => patchDraft({ whatsapp: v })}
          />
          <InlineField
            variant="controlled"
            label="Telegram"
            type="text"
            value={draft.telegram}
            placeholder="@username"
            icon={<MessageCircle size={12} />}
            disabled={saving}
            onValueChange={(v) => patchDraft({ telegram: v })}
          />
        </div>
      </DetailSheetSection>

      <DetailSheetSection title="Notes" icon={<MessageCircle size={12} />}>
        <InlineField
          variant="controlled"
          label=""
          type="textarea"
          value={draft.notes}
          placeholder="Preferences, important details…"
          icon={<MessageCircle size={12} />}
          disabled={saving}
          onValueChange={(v) => patchDraft({ notes: v })}
        />
      </DetailSheetSection>

      {contact.companies.length > 0 ? (
        <DetailSheetSection
          title={`Companies (${contact.companies.length})`}
          icon={<Building2 size={12} />}
        >
          <div className="space-y-2">
            {contact.companies.map((c) => (
              <div
                key={c.id}
                className="border-border flex items-center gap-2 rounded-lg border p-3 text-sm"
              >
                <Building2 size={14} className="text-muted-foreground" />
                <span className="font-medium">{c.name}</span>
              </div>
            ))}
          </div>
        </DetailSheetSection>
      ) : null}

      <DetailSheetSection title="Activity" icon={<FolderKanban size={12} />}>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <FolderKanban size={16} className="text-muted-foreground mx-auto" />
            <p className="mt-1 text-lg font-bold">{contact._count.projects}</p>
            <p className="text-muted-foreground text-[10px]">Projects</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <User size={16} className="text-muted-foreground mx-auto" />
            <p className="mt-1 text-lg font-bold">{contact._count.leads}</p>
            <p className="text-muted-foreground text-[10px]">Leads</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <Handshake size={16} className="text-muted-foreground mx-auto" />
            <p className="mt-1 text-lg font-bold">{contact._count.deals}</p>
            <p className="text-muted-foreground text-[10px]">Deals</p>
          </div>
        </div>
      </DetailSheetSection>
    </div>
  );
}
