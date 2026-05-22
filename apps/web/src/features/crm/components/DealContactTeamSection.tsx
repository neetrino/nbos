'use client';

import { Building2, Calendar, Clock, User, UserCog } from 'lucide-react';
import {
  DETAIL_SHEET_PERSON_AVATAR_CLASS,
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DetailSheetSection,
  InlineField,
  RelationPickerField,
  SearchField,
} from '@/components/shared';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import type { Deal } from '@/lib/api/deals';
import type { DealGeneralDraft } from './deal-general-form-state';
import type { SearchLoader } from './deal-general-tab.types';
import { DEAL_SHEET_SECTION } from '@/features/shared/crm-sheet-section-ids';
import { dealStageGateFieldClass } from '@/features/crm/deal-stage-gate-highlight';

interface DealContactTeamSectionProps {
  deal: Deal;
  draft: DealGeneralDraft;
  patchDraft: (partial: Partial<DealGeneralDraft>) => void;
  searchContacts: SearchLoader;
  searchEmployees: SearchLoader;
  disabled?: boolean;
  sectionClassName?: string;
  gateRequiredFields?: ReadonlySet<string>;
}

export function DealContactTeamSection({
  deal,
  draft,
  patchDraft,
  searchContacts,
  searchEmployees,
  disabled = false,
  sectionClassName,
  gateRequiredFields = new Set(),
}: DealContactTeamSectionProps) {
  const contactPicker = useRelationPickerActions('contact', 'deal-contact');

  const contactSubtitle =
    draft.contactId && deal.contact?.id === draft.contactId ? (deal.contact.email ?? null) : null;

  return (
    <DetailSheetSection
      id={DEAL_SHEET_SECTION.CONTACT_TEAM}
      title="Contact & team"
      icon={<User size={12} />}
      className={sectionClassName}
    >
      <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
        <RelationPickerField
          label="Contact"
          entityKind="contact"
          value={draft.contactId}
          selectionLabel={draft.contactDisplayLabel}
          selectionSubtitle={contactSubtitle}
          placeholder="Search contacts…"
          icon={<User size={12} />}
          disabled={disabled}
          onSearch={searchContacts}
          onSelect={(value, label) => patchDraft({ contactId: value, contactDisplayLabel: label })}
          onClear={() => patchDraft({ contactId: null, contactDisplayLabel: null })}
          {...contactPicker}
        />

        <SearchField
          selectionMode="stage"
          label="Seller"
          value={draft.sellerId}
          displayValue={<SellerDisplay deal={deal} draft={draft} />}
          placeholder="Select seller…"
          icon={<Building2 size={12} />}
          disabled={disabled}
          onSearch={searchEmployees}
          onStageSelect={(value, label) =>
            patchDraft({ sellerId: value, sellerDisplayLabel: label })
          }
        />

        <SearchField
          selectionMode="stage"
          label="Sales assistant"
          value={draft.sellerAssistantId}
          displayValue={<AssistantDisplay deal={deal} draft={draft} />}
          placeholder="Optional — search employee…"
          icon={<Building2 size={12} />}
          disabled={disabled}
          onSearch={searchEmployees}
          onStageSelect={(value, label) =>
            patchDraft({ sellerAssistantId: value, sellerAssistantDisplayLabel: label })
          }
          onClear={() => patchDraft({ sellerAssistantId: null, sellerAssistantDisplayLabel: null })}
        />

        <SearchField
          selectionMode="stage"
          label="PM assigned"
          value={draft.pmId}
          className={dealStageGateFieldClass(gateRequiredFields, 'pmId')}
          displayValue={<PmDisplay deal={deal} draft={draft} />}
          placeholder="Select project manager…"
          icon={<UserCog size={12} />}
          disabled={disabled}
          onSearch={searchEmployees}
          onStageSelect={(value, label) => patchDraft({ pmId: value, pmDisplayLabel: label })}
          onClear={() => patchDraft({ pmId: null, pmDisplayLabel: null })}
        />

        <InlineField
          label="Created"
          value={formatStaticDate(deal.createdAt)}
          icon={<Calendar size={12} />}
          editable={false}
        />

        <InlineField
          label="Last Updated"
          value={formatStaticDate(deal.updatedAt)}
          icon={<Clock size={12} />}
          editable={false}
        />
      </div>
    </DetailSheetSection>
  );
}

function SellerDisplay({ deal, draft }: { deal: Deal; draft: DealGeneralDraft }) {
  if (draft.sellerId && deal.seller?.id === draft.sellerId) {
    return (
      <div className="flex items-center gap-2.5">
        <div className={DETAIL_SHEET_PERSON_AVATAR_CLASS}>
          {deal.seller.firstName[0]}
          {deal.seller.lastName[0]}
        </div>
        <span className="text-foreground text-sm font-medium">
          {deal.seller.firstName} {deal.seller.lastName}
        </span>
      </div>
    );
  }
  if (draft.sellerDisplayLabel) {
    return <LabelPersonDisplay label={draft.sellerDisplayLabel} />;
  }
  return undefined;
}

function PmDisplay({ deal, draft }: { deal: Deal; draft: DealGeneralDraft }) {
  if (draft.pmId && deal.pm?.id === draft.pmId) {
    return (
      <div className="flex items-center gap-2.5">
        <div className={DETAIL_SHEET_PERSON_AVATAR_CLASS}>
          {deal.pm.firstName[0]}
          {deal.pm.lastName[0]}
        </div>
        <span className="text-foreground text-sm font-medium">
          {deal.pm.firstName} {deal.pm.lastName}
        </span>
      </div>
    );
  }
  if (draft.pmDisplayLabel) {
    return <LabelPersonDisplay label={draft.pmDisplayLabel} />;
  }
  return undefined;
}

function AssistantDisplay({ deal, draft }: { deal: Deal; draft: DealGeneralDraft }) {
  if (draft.sellerAssistantId && deal.sellerAssistant?.id === draft.sellerAssistantId) {
    const assistant = deal.sellerAssistant;
    return (
      <div className="flex items-center gap-2.5">
        <div className={DETAIL_SHEET_PERSON_AVATAR_CLASS}>
          {assistant.firstName[0]}
          {assistant.lastName[0]}
        </div>
        <span className="text-foreground text-sm font-medium">
          {assistant.firstName} {assistant.lastName}
        </span>
      </div>
    );
  }
  if (draft.sellerAssistantDisplayLabel) {
    return <LabelPersonDisplay label={draft.sellerAssistantDisplayLabel} />;
  }
  return undefined;
}

function LabelPersonDisplay({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={DETAIL_SHEET_PERSON_AVATAR_CLASS}>{initialsFromLabel(label)}</div>
      <span className="text-foreground text-sm font-medium">{label}</span>
    </div>
  );
}

function initialsFromLabel(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const a = parts[0]?.[0] ?? '';
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : (parts[0]?.[1] ?? '');
  return `${a}${b}`.toUpperCase() || '?';
}

function formatStaticDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
