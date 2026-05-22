'use client';

import { Building2, Calendar, FileText, MessageCircle, Receipt, Tag, User } from 'lucide-react';
import {
  DetailSheetSection,
  InlineField,
  RelationPickerField,
  StatusBadge,
} from '@/components/shared';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { COMPANY_TYPES, getTaxStatus } from '../constants/clients';
import { companyTypeNumberLabel } from '../constants/company-type-field-copy';
import type { Company } from '@/lib/api/clients';
import type { CompanyPortfolioResponse } from '@/lib/api/client-portfolio';
import type { CompanyGeneralDraft } from './company-general-form-state';
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

export interface CompanySheetScrollBodyProps {
  company: Company;
  draft: CompanyGeneralDraft;
  patchDraft: (partial: Partial<CompanyGeneralDraft>) => void;
  saving: boolean;
  generalError: string | null;
  portfolioData: CompanyPortfolioResponse | null;
  portfolioLoading: boolean;
  portfolioError: string | null;
  searchContacts: (
    query: string,
  ) => Promise<Array<{ value: string; label: string; subtitle?: string }>>;
  onPortfolioRetry: () => void;
}

export function CompanySheetScrollBody({
  company,
  draft,
  patchDraft,
  saving,
  generalError,
  portfolioData,
  portfolioLoading,
  portfolioError,
  searchContacts,
  onPortfolioRetry,
}: CompanySheetScrollBodyProps) {
  const contactPicker = useRelationPickerActions('contact', 'company-sheet-primary');
  const billingContactPicker = useRelationPickerActions('contact', 'company-sheet-billing');
  const taxStatus = getTaxStatus(company.taxStatus);
  const typeOptions = COMPANY_TYPES.map((t) => ({ value: t.value, label: t.label }));

  return (
    <div className="space-y-6 px-7 py-5">
      {generalError ? (
        <p className="text-destructive text-center text-sm" role="alert">
          {generalError}
        </p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6">
          <DetailSheetSection title="Company details" icon={<Tag size={12} />}>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <InlineField
                variant="controlled"
                label="Legal type"
                type="select"
                value={draft.type}
                options={typeOptions}
                icon={<Tag size={12} />}
                disabled={saving}
                onValueChange={(v) => {
                  if (v) patchDraft({ type: v });
                }}
              />
              <InlineField
                label="Tax status"
                value={taxStatus?.label ?? company.taxStatus}
                displayValue={
                  taxStatus ? (
                    <StatusBadge label={taxStatus.label} variant={taxStatus.variant} />
                  ) : undefined
                }
                icon={<Receipt size={12} />}
                editable={false}
              />
              <InlineField
                variant="controlled"
                label={companyTypeNumberLabel(draft.type)}
                type="text"
                value={draft.taxId}
                placeholder="Optional"
                icon={<FileText size={12} />}
                disabled={saving}
                onValueChange={(v) => patchDraft({ taxId: v })}
              />
              <InlineField
                variant="controlled"
                label="Legal address"
                type="text"
                value={draft.legalAddress}
                placeholder="Address…"
                icon={<Building2 size={12} />}
                disabled={saving}
                onValueChange={(v) => patchDraft({ legalAddress: v })}
              />
              <InlineField
                variant="controlled"
                label="Phone"
                type="phone"
                value={draft.phone}
                placeholder="+374…"
                icon={<User size={12} />}
                disabled={saving}
                onValueChange={(v) => patchDraft({ phone: v })}
              />
              <InlineField
                variant="controlled"
                label="Email"
                type="email"
                value={draft.email}
                placeholder="email@…"
                icon={<User size={12} />}
                disabled={saving}
                onValueChange={(v) => patchDraft({ email: v })}
              />
              <InlineField
                variant="controlled"
                label="Country"
                type="text"
                value={draft.country}
                placeholder="Country"
                icon={<Building2 size={12} />}
                disabled={saving}
                onValueChange={(v) => patchDraft({ country: v })}
              />
              <InlineField
                label="Created"
                value={formatShortDate(company.createdAt)}
                icon={<Calendar size={12} />}
                editable={false}
              />
            </div>
          </DetailSheetSection>

          <DetailSheetSection title="Contacts" icon={<User size={12} />}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <RelationPickerField
                label="Primary contact"
                entityKind="contact"
                value={draft.primaryContactId || null}
                selectionLabel={draft.primaryContactLabel || null}
                placeholder="Search contacts…"
                icon={<User size={12} />}
                maxResults={25}
                disabled={saving}
                onSearch={searchContacts}
                onSelect={(id, label) =>
                  patchDraft({ primaryContactId: id, primaryContactLabel: label })
                }
                {...contactPicker}
              />
              <RelationPickerField
                label="Billing contact"
                entityKind="contact"
                value={draft.billingContactId || null}
                selectionLabel={draft.billingContactLabel || null}
                placeholder="Optional — clear to match primary"
                icon={<User size={12} />}
                maxResults={25}
                disabled={saving}
                onSearch={searchContacts}
                onSelect={(id, label) =>
                  patchDraft({ billingContactId: id, billingContactLabel: label })
                }
                onClear={() => patchDraft({ billingContactId: '', billingContactLabel: '' })}
                {...billingContactPicker}
              />
            </div>
          </DetailSheetSection>

          <DetailSheetSection title="Notes" icon={<MessageCircle size={12} />}>
            <InlineField
              variant="controlled"
              label=""
              type="textarea"
              value={draft.notes}
              placeholder="Internal notes…"
              icon={<MessageCircle size={12} />}
              disabled={saving}
              onValueChange={(v) => patchDraft({ notes: v })}
            />
          </DetailSheetSection>
        </div>

        <div className="space-y-4">
          <ClientPortfolioGeneralActions
            variant="company"
            entityId={company.id}
            data={portfolioData}
            loading={portfolioLoading}
            error={portfolioError}
            onRetry={onPortfolioRetry}
          />
        </div>
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
