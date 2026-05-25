'use client';

import { Building2, Calendar, Clock, User, UserCog } from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DetailSheetSection,
  InlineField,
  RelationPickerField,
} from '@/components/shared';
import {
  useContactRelationSearch,
  useRelationPickerActions,
} from '@/components/shared/relation-picker';
import type { Deal } from '@/lib/api/deals';
import type { DealGeneralDraft } from './deal-general-form-state';
import type { SearchLoader } from './deal-general-tab.types';
import { DEAL_SHEET_SECTION } from '@/features/shared/crm-sheet-section-ids';
import { dealStageGateFieldClass } from '@/features/crm/deal-stage-gate-highlight';

interface DealContactTeamSectionProps {
  deal: Deal;
  draft: DealGeneralDraft;
  patchDraft: (partial: Partial<DealGeneralDraft>) => void;
  searchEmployees: SearchLoader;
  disabled?: boolean;
  sectionClassName?: string;
  gateRequiredFields?: ReadonlySet<string>;
}

export function DealContactTeamSection({
  deal,
  draft,
  patchDraft,
  searchEmployees,
  disabled = false,
  sectionClassName,
  gateRequiredFields = new Set(),
}: DealContactTeamSectionProps) {
  const contactsPicker = useRelationPickerActions('contact', 'deal-contacts');
  const contactRelationSearch = useContactRelationSearch();
  const employeePicker = useRelationPickerActions('employee');

  return (
    <DetailSheetSection
      id={DEAL_SHEET_SECTION.CONTACT_TEAM}
      title="Contact & team"
      icon={<User size={12} />}
      className={sectionClassName}
    >
      <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
        <RelationPickerField
          label="Contacts"
          entityKind="contact"
          multiple
          value={draft.contactIds}
          selectionLabels={draft.contactLabels}
          placeholder="Search or create contact…"
          icon={<User size={12} />}
          disabled={disabled}
          onSearch={contactRelationSearch}
          onChange={(ids, labels) => patchDraft({ contactIds: ids, contactLabels: labels })}
          {...contactsPicker}
        />

        <RelationPickerField
          label="Seller"
          entityKind="employee"
          value={draft.sellerId}
          selectionLabel={
            draft.sellerDisplayLabel ??
            (deal.seller ? `${deal.seller.firstName} ${deal.seller.lastName}` : null)
          }
          placeholder="Select seller…"
          icon={<Building2 size={12} />}
          disabled={disabled}
          onSearch={searchEmployees}
          onSelect={(value, label) => patchDraft({ sellerId: value, sellerDisplayLabel: label })}
          {...employeePicker}
        />

        <RelationPickerField
          label="Sales assistant"
          entityKind="employee"
          value={draft.sellerAssistantId}
          selectionLabel={
            draft.sellerAssistantDisplayLabel ??
            (deal.sellerAssistant
              ? `${deal.sellerAssistant.firstName} ${deal.sellerAssistant.lastName}`
              : null)
          }
          placeholder="Optional — search employee…"
          icon={<Building2 size={12} />}
          disabled={disabled}
          onSearch={searchEmployees}
          onSelect={(value, label) =>
            patchDraft({ sellerAssistantId: value, sellerAssistantDisplayLabel: label })
          }
          onClear={() => patchDraft({ sellerAssistantId: null, sellerAssistantDisplayLabel: null })}
          {...employeePicker}
        />

        <RelationPickerField
          label="PM assigned"
          entityKind="employee"
          value={draft.pmId}
          selectionLabel={
            draft.pmDisplayLabel ?? (deal.pm ? `${deal.pm.firstName} ${deal.pm.lastName}` : null)
          }
          className={dealStageGateFieldClass(gateRequiredFields, 'pmId')}
          placeholder="Select project manager…"
          icon={<UserCog size={12} />}
          disabled={disabled}
          onSearch={searchEmployees}
          onSelect={(value, label) => patchDraft({ pmId: value, pmDisplayLabel: label })}
          onClear={() => patchDraft({ pmId: null, pmDisplayLabel: null })}
          {...employeePicker}
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

function formatStaticDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
