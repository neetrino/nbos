'use client';

import {
  Building2,
  Calendar,
  FileText,
  FolderKanban,
  MessageCircle,
  Receipt,
  Tag,
  User,
} from 'lucide-react';
import { DetailSheetSection, InlineField, SearchField, StatusBadge } from '@/components/shared';
import { COMPANY_TYPES, getTaxStatus } from '../constants/clients';
import { companyTypeNumberLabel } from '../constants/company-type-field-copy';
import type { Company } from '@/lib/api/clients';
import type { CompanyGeneralDraft } from './company-general-form-state';

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
  searchContacts: (
    query: string,
  ) => Promise<Array<{ value: string; label: string; subtitle?: string }>>;
}

export function CompanySheetScrollBody({
  company,
  draft,
  patchDraft,
  saving,
  generalError,
  searchContacts,
}: CompanySheetScrollBodyProps) {
  const taxStatus = getTaxStatus(company.taxStatus);
  const typeOptions = COMPANY_TYPES.map((t) => ({ value: t.value, label: t.label }));

  return (
    <div className="space-y-6 px-7 py-5">
      {generalError ? (
        <p className="text-destructive text-center text-sm" role="alert">
          {generalError}
        </p>
      ) : null}

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
          <SearchField
            selectionMode="stage"
            label="Primary contact"
            value={draft.primaryContactId}
            displayValue={
              draft.primaryContactLabel ? (
                <span className="text-foreground text-sm font-medium">
                  {draft.primaryContactLabel}
                </span>
              ) : undefined
            }
            placeholder="Search contacts…"
            icon={<User size={12} />}
            maxResults={25}
            disabled={saving}
            onSearch={searchContacts}
            onStageSelect={(id, label) =>
              patchDraft({ primaryContactId: id, primaryContactLabel: label })
            }
          />
          <SearchField
            selectionMode="stage"
            label="Billing contact"
            value={draft.billingContactId}
            displayValue={
              draft.billingContactLabel ? (
                <span className="text-foreground text-sm font-medium">
                  {draft.billingContactLabel}
                </span>
              ) : undefined
            }
            placeholder="Optional — clear to match primary"
            icon={<User size={12} />}
            maxResults={25}
            disabled={saving}
            onSearch={searchContacts}
            onStageSelect={(id, label) =>
              patchDraft({ billingContactId: id, billingContactLabel: label })
            }
            onClear={() => patchDraft({ billingContactId: '', billingContactLabel: '' })}
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

      <DetailSheetSection title="Activity" icon={<FolderKanban size={12} />}>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <FolderKanban size={16} className="text-muted-foreground mx-auto" />
            <p className="mt-1 text-lg font-bold">{company._count.projects}</p>
            <p className="text-muted-foreground text-[10px]">Projects</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <FileText size={16} className="text-muted-foreground mx-auto" />
            <p className="mt-1 text-lg font-bold">{company._count.invoices}</p>
            <p className="text-muted-foreground text-[10px]">Invoices</p>
          </div>
        </div>
      </DetailSheetSection>
    </div>
  );
}
