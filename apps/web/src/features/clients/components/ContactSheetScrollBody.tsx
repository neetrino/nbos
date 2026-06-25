'use client';

import { Building2, Calendar, Mail, MessageCircle, Phone, User } from 'lucide-react';
import { DetailSheetSection, EntityNotesSection, InlineField } from '@/components/shared';
import { CONTACT_ROLES, LANGUAGES, PREFERRED_CHANNELS } from '../constants/clients';
import type { Contact } from '@/lib/api/clients';
import type { ContactPortfolioResponse } from '@/lib/api/client-portfolio';
import type { ContactGeneralDraft } from './contact-general-form-state';
import {
  ClientPortfolioAnalytics,
  ClientPortfolioGeneralActions,
} from './client-portfolio/ClientPortfolioEmbedded';

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
  readOnly?: boolean;
  generalError: string | null;
  portfolioData: ContactPortfolioResponse | null;
  portfolioLoading: boolean;
  portfolioError: string | null;
  onPortfolioRetry: () => void;
}

export function ContactSheetScrollBody({
  contact,
  draft,
  patchDraft,
  saving,
  readOnly = false,
  generalError,
  portfolioData,
  portfolioLoading,
  portfolioError,
  onPortfolioRetry,
}: ContactSheetScrollBodyProps) {
  const fieldDisabled = saving || readOnly;
  const channelOptions = PREFERRED_CHANNELS.map((c) => ({ value: c.value, label: c.label }));
  const contactRoleOptions = CONTACT_ROLES.map((r) => ({ value: r.value, label: r.label }));
  const languageOptions = LANGUAGES.map((l) => ({ value: l.value, label: l.label }));

  return (
    <div className="space-y-6 px-5 py-5">
      {generalError ? (
        <p className="text-destructive text-center text-sm" role="alert">
          {generalError}
        </p>
      ) : null}

      <div className="space-y-6">
        <DetailSheetSection title="Contact info" icon={<User size={12} />}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <InlineField
              variant="controlled"
              label="First name"
              type="text"
              value={draft.firstName}
              placeholder="First name"
              icon={<User size={12} />}
              disabled={fieldDisabled}
              onValueChange={(v) => patchDraft({ firstName: v })}
            />
            <InlineField
              variant="controlled"
              label="Last name"
              type="text"
              value={draft.lastName}
              placeholder="Last name"
              icon={<User size={12} />}
              disabled={fieldDisabled}
              onValueChange={(v) => patchDraft({ lastName: v })}
            />
            <InlineField
              variant="controlled"
              label="Phone"
              type="phone"
              value={draft.phone}
              placeholder="+374…"
              icon={<Phone size={12} />}
              disabled={fieldDisabled}
              onValueChange={(v) => patchDraft({ phone: v })}
            />
            <InlineField
              variant="controlled"
              label="Email"
              type="email"
              value={draft.email}
              placeholder="email@…"
              icon={<Mail size={12} />}
              disabled={fieldDisabled}
              onValueChange={(v) => patchDraft({ email: v })}
            />
          </div>
        </DetailSheetSection>

        <DetailSheetSection title="Details" icon={<User size={12} />}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <InlineField
              variant="controlled"
              label="Contact type"
              type="select"
              value={draft.role}
              options={contactRoleOptions}
              placeholder="Select…"
              icon={<User size={12} />}
              disabled={fieldDisabled}
              onValueChange={(role) => patchDraft({ role })}
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
              disabled={fieldDisabled}
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
              disabled={fieldDisabled}
              onValueChange={(language) => patchDraft({ language: language ?? '' })}
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
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <InlineField
              variant="controlled"
              label="WhatsApp"
              type="text"
              value={draft.whatsapp}
              placeholder="+374…"
              icon={<Phone size={12} />}
              disabled={fieldDisabled}
              onValueChange={(v) => patchDraft({ whatsapp: v })}
            />
            <InlineField
              variant="controlled"
              label="Telegram"
              type="text"
              value={draft.telegram}
              placeholder="@username"
              icon={<MessageCircle size={12} />}
              disabled={fieldDisabled}
              onValueChange={(v) => patchDraft({ telegram: v })}
            />
          </div>
        </DetailSheetSection>

        <EntityNotesSection
          title="Notes"
          icon={<MessageCircle size={12} />}
          entityType="contact"
          entityId={contact.id}
          value={draft.notes}
          onChange={(notes) => patchDraft({ notes: notes ?? '' })}
          placeholder="Preferences, important details…"
          disabled={fieldDisabled}
        />

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

        <ClientPortfolioGeneralActions
          variant="contact"
          entityId={contact.id}
          data={portfolioData}
          loading={portfolioLoading}
          error={portfolioError}
          onRetry={onPortfolioRetry}
        />
      </div>

      <ClientPortfolioAnalytics
        data={portfolioData}
        loading={portfolioLoading}
        error={portfolioError}
        onRetry={onPortfolioRetry}
      />
    </div>
  );
}
