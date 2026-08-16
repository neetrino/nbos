'use client';

import { Building2, User, UserCog } from 'lucide-react';
import {
  DETAIL_SHEET_COLUMN_DIVIDER_CLASS,
  DetailSheetSection,
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
      <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 sm:items-stretch sm:gap-0">
        <div className="min-w-0 space-y-4 sm:pr-5">
          <RelationPickerField
            label="Seller"
            entityKind="employee"
            value={draft.sellerId}
            selectionLabel={
              draft.sellerDisplayLabel ??
              (deal.seller ? `${deal.seller.firstName} ${deal.seller.lastName}` : null)
            }
            selectionAvatar={draft.sellerAvatar}
            icon={<Building2 size={12} />}
            disabled={disabled}
            onSearch={searchEmployees}
            onSelect={(value, label, avatar) =>
              patchDraft({
                sellerId: value,
                sellerDisplayLabel: label,
                sellerAvatar: avatar?.trim() || null,
              })
            }
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
            selectionAvatar={draft.sellerAssistantAvatar}
            icon={<Building2 size={12} />}
            disabled={disabled}
            onSearch={searchEmployees}
            onSelect={(value, label, avatar) =>
              patchDraft({
                sellerAssistantId: value,
                sellerAssistantDisplayLabel: label,
                sellerAssistantAvatar: avatar?.trim() || null,
              })
            }
            onClear={() =>
              patchDraft({
                sellerAssistantId: null,
                sellerAssistantDisplayLabel: null,
                sellerAssistantAvatar: null,
              })
            }
            {...employeePicker}
          />

          <RelationPickerField
            label="PM assigned"
            entityKind="employee"
            value={draft.pmId}
            selectionLabel={
              draft.pmDisplayLabel ?? (deal.pm ? `${deal.pm.firstName} ${deal.pm.lastName}` : null)
            }
            selectionAvatar={draft.pmAvatar}
            className={dealStageGateFieldClass(gateRequiredFields, 'pmId')}
            icon={<UserCog size={12} />}
            disabled={disabled}
            onSearch={searchEmployees}
            onSelect={(value, label, avatar) =>
              patchDraft({
                pmId: value,
                pmDisplayLabel: label,
                pmAvatar: avatar?.trim() || null,
              })
            }
            onClear={() => patchDraft({ pmId: null, pmDisplayLabel: null, pmAvatar: null })}
            {...employeePicker}
          />
        </div>

        <div className={`min-w-0 space-y-4 sm:h-full ${DETAIL_SHEET_COLUMN_DIVIDER_CLASS}`}>
          <RelationPickerField
            label="Contacts"
            entityKind="contact"
            multiple
            value={draft.contactIds}
            selectionLabels={draft.contactLabels}
            className={dealStageGateFieldClass(gateRequiredFields, 'contactId')}
            placeholder="Search or create contact…"
            icon={<User size={12} />}
            disabled={disabled}
            onSearch={contactRelationSearch}
            onChange={(ids, labels) => patchDraft({ contactIds: ids, contactLabels: labels })}
            {...contactsPicker}
          />
        </div>
      </div>
    </DetailSheetSection>
  );
}
