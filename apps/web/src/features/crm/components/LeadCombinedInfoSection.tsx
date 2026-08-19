'use client';

import { useState } from 'react';
import { User, Phone, Mail, Link2, LayoutGrid } from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DETAIL_SHEET_SUBSECTION_LABEL_CLASS,
  DetailSheetCollapsibleSection,
  InlineField,
  RelationPickerField,
  StatusBadge,
} from '@/components/shared';
import {
  useContactRelationSearch,
  useEmployeeRelationSearch,
  useRelationPickerActions,
} from '@/components/shared/relation-picker';
import type { Lead } from '@/lib/api/leads';
import type { LeadSheetSectionId } from '@/features/shared/crm-sheet-section-ids';
import { leadStageGateFieldClass } from '@/features/crm/lead-stage-gate-highlight';
import type { LeadGeneralDraft } from './lead-general-form-state';
import { LeadMarketingFields } from './LeadGeneralMarketingSection';
import { shouldHideLeadIdentityFields } from './lead-identity-fields';

interface LeadCombinedInfoSectionProps {
  lead: Lead;
  draft: LeadGeneralDraft;
  patchDraft: (partial: Partial<LeadGeneralDraft>) => void;
  formDisabled?: boolean;
  gateRequiredFields?: ReadonlySet<string>;
  sectionIds: {
    contact: LeadSheetSectionId;
    marketing: LeadSheetSectionId;
    assignment: LeadSheetSectionId;
  };
}

export function LeadCombinedInfoSection({
  lead,
  draft,
  patchDraft,
  formDisabled = false,
  gateRequiredFields = new Set(),
  sectionIds,
}: LeadCombinedInfoSectionProps) {
  const [open, setOpen] = useState(true);

  const contactsPicker = useRelationPickerActions('contact', 'lead-contacts');
  const contactRelationSearch = useContactRelationSearch();
  const employeePicker = useRelationPickerActions('employee');
  const searchEmployees = useEmployeeRelationSearch();
  const hideIdentityFields = shouldHideLeadIdentityFields({
    contactId: lead.contactId,
    contactIds: draft.contactIds,
  });

  return (
    <DetailSheetCollapsibleSection
      title="Lead details"
      icon={<LayoutGrid size={12} />}
      open={open}
      onOpenChange={setOpen}
    >
      <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 md:gap-0">
        <div id={sectionIds.contact} className="min-w-0 md:pr-5">
          <p className={DETAIL_SHEET_SUBSECTION_LABEL_CLASS}>Contact</p>
          <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
            {!hideIdentityFields ? (
              <>
                <InlineField
                  variant="controlled"
                  label="Contact name"
                  hideLabel
                  type="text"
                  value={draft.contactName}
                  placeholder="Contact name…"
                  icon={<User size={18} />}
                  disabled={formDisabled}
                  className={leadStageGateFieldClass(gateRequiredFields, 'contactName')}
                  onValueChange={(v) => patchDraft({ contactName: v })}
                />
                <InlineField
                  variant="controlled"
                  label="Phone"
                  hideLabel
                  type="phone"
                  value={draft.phone ?? ''}
                  placeholder="+374…"
                  icon={<Phone size={18} />}
                  disabled={formDisabled}
                  className={leadStageGateFieldClass(gateRequiredFields, 'phone')}
                  onValueChange={(v) => patchDraft({ phone: v || null })}
                />
                <InlineField
                  variant="controlled"
                  label="Email"
                  hideLabel
                  type="email"
                  value={draft.email ?? ''}
                  placeholder="email@example.com"
                  icon={<Mail size={18} />}
                  disabled={formDisabled}
                  className={leadStageGateFieldClass(gateRequiredFields, 'email')}
                  onValueChange={(v) => patchDraft({ email: v || null })}
                />
              </>
            ) : null}
            <RelationPickerField
              label="Contacts"
              entityKind="contact"
              multiple
              value={draft.contactIds}
              selectionLabels={draft.contactLabels}
              placeholder="Link CRM contacts…"
              icon={<User size={12} />}
              disabled={formDisabled}
              onSearch={contactRelationSearch}
              onChange={(ids, labels) => patchDraft({ contactIds: ids, contactLabels: labels })}
              {...contactsPicker}
            />
            <div id={sectionIds.assignment}>
              <RelationPickerField
                label="Seller"
                entityKind="employee"
                className={leadStageGateFieldClass(gateRequiredFields, 'assignedTo')}
                value={draft.assignedTo}
                selectionLabel={
                  draft.sellerDisplayLabel ??
                  (lead.assignee ? `${lead.assignee.firstName} ${lead.assignee.lastName}` : null)
                }
                selectionAvatar={draft.sellerAvatar}
                icon={<User size={12} />}
                disabled={formDisabled}
                onSearch={searchEmployees}
                onSelect={(value, label, avatar) =>
                  patchDraft({
                    assignedTo: value,
                    sellerDisplayLabel: label,
                    sellerAvatar: avatar?.trim() || null,
                  })
                }
                onClear={
                  formDisabled || gateRequiredFields.has('assignedTo')
                    ? undefined
                    : () =>
                        patchDraft({
                          assignedTo: null,
                          sellerDisplayLabel: null,
                          sellerAvatar: null,
                        })
                }
                {...employeePicker}
              />
            </div>
          </div>
        </div>
        <div id={sectionIds.marketing} className="border-border min-w-0 md:border-l md:pl-5">
          <p className={DETAIL_SHEET_SUBSECTION_LABEL_CLASS}>Marketing</p>
          <LeadMarketingFields
            lead={lead}
            draft={draft}
            patchDraft={patchDraft}
            formDisabled={formDisabled}
            gateRequiredFields={gateRequiredFields}
          />
        </div>
      </div>

      {lead.deal ? (
        <div className="mt-10">
          <p className={DETAIL_SHEET_SUBSECTION_LABEL_CLASS}>Linked deal</p>
          <div className="border-border bg-muted/20 flex items-center gap-3 rounded-xl border p-3 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Link2 size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{lead.deal.code}</p>
              <StatusBadge label={lead.deal.status.replace(/_/g, ' ')} variant="blue" />
            </div>
          </div>
        </div>
      ) : null}
    </DetailSheetCollapsibleSection>
  );
}
