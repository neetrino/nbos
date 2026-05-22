'use client';

import { useCallback, type ReactNode } from 'react';
import { Phone, Mail, User, Calendar, Clock, MessageSquare, Link2, Building2 } from 'lucide-react';
import { DetailSheetSection, StatusBadge, InlineField, SearchField } from '@/components/shared';
import { DeliveryTeamEmployeeChoiceDisplay } from '@/features/projects/components/delivery-board/delivery-team-employee-display';
import type { Lead } from '@/lib/api/leads';
import { employeesApi } from '@/lib/api/employees';
import type { LeadGeneralDraft } from './lead-general-form-state';
import type { LeadSheetSectionId } from '@/features/shared/crm-sheet-section-ids';
import { LeadGeneralMarketingSection } from './LeadGeneralMarketingSection';
import { leadStageGateFieldClass } from '@/features/crm/lead-stage-gate-highlight';

export interface LeadGeneralTabProps {
  lead: Lead;
  draft: LeadGeneralDraft;
  patchDraft: (partial: Partial<LeadGeneralDraft>) => void;
  formDisabled?: boolean;
  gateRequiredFields?: ReadonlySet<string>;
  sectionIds: {
    contact: LeadSheetSectionId;
    marketing: LeadSheetSectionId;
    assignment: LeadSheetSectionId;
    notes: LeadSheetSectionId;
  };
}

export function LeadGeneralTab({
  lead,
  draft,
  patchDraft,
  formDisabled = false,
  gateRequiredFields = new Set(),
  sectionIds,
}: LeadGeneralTabProps) {
  const searchEmployees = useCallback(async (query: string) => {
    const data = await employeesApi.getAll({ pageSize: 8, search: query || undefined });
    return data.items.map((employee) => ({
      value: employee.id,
      label: `${employee.firstName} ${employee.lastName}`,
    }));
  }, []);

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:gap-8">
      <div className="space-y-6">
        <DetailSheetSection id={sectionIds.contact} title="Contact" icon={<User size={12} />}>
          <div className="space-y-4">
            <InlineField
              variant="controlled"
              label="Contact name"
              type="text"
              value={draft.contactName}
              placeholder="Contact name…"
              icon={<User size={12} />}
              disabled={formDisabled}
              className={leadStageGateFieldClass(gateRequiredFields, 'contactName')}
              onValueChange={(v) => patchDraft({ contactName: v })}
            />
            <InlineField
              variant="controlled"
              label="Phone"
              type="phone"
              value={draft.phone ?? ''}
              placeholder="+374…"
              icon={<Phone size={12} />}
              disabled={formDisabled}
              className={leadStageGateFieldClass(gateRequiredFields, 'phone')}
              onValueChange={(v) => patchDraft({ phone: v || null })}
            />
            <InlineField
              variant="controlled"
              label="Email"
              type="email"
              value={draft.email ?? ''}
              placeholder="email@example.com"
              icon={<Mail size={12} />}
              disabled={formDisabled}
              className={leadStageGateFieldClass(gateRequiredFields, 'email')}
              onValueChange={(v) => patchDraft({ email: v || null })}
            />
          </div>
        </DetailSheetSection>

        <LeadGeneralMarketingSection
          lead={lead}
          draft={draft}
          patchDraft={patchDraft}
          formDisabled={formDisabled}
          sectionId={sectionIds.marketing}
          gateRequiredFields={gateRequiredFields}
        />

        <DetailSheetSection id={sectionIds.assignment} title="Team" icon={<Building2 size={12} />}>
          <SearchField
            selectionMode="stage"
            label="Seller"
            className={leadStageGateFieldClass(gateRequiredFields, 'assignedTo')}
            value={draft.assignedTo}
            displayValue={
              draft.sellerDisplayLabel ? (
                <DeliveryTeamEmployeeChoiceDisplay label={draft.sellerDisplayLabel} />
              ) : undefined
            }
            placeholder="Search seller…"
            icon={<User size={12} />}
            disabled={formDisabled}
            onSearch={searchEmployees}
            onStageSelect={(value, label) =>
              patchDraft({ assignedTo: value, sellerDisplayLabel: label })
            }
            onClear={
              formDisabled
                ? undefined
                : () => patchDraft({ assignedTo: null, sellerDisplayLabel: null })
            }
          />
        </DetailSheetSection>

        {lead.deal ? (
          <DetailSheetSection title="Linked deal" icon={<Link2 size={12} />}>
            <div className="border-border bg-muted/20 flex items-center gap-3 rounded-xl border p-3 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Link2 size={16} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{lead.deal.code}</p>
                <StatusBadge label={lead.deal.status.replace(/_/g, ' ')} variant="blue" />
              </div>
            </div>
          </DetailSheetSection>
        ) : null}

        <DetailSheetSection
          id={sectionIds.notes}
          title="Notes & activity"
          icon={<MessageSquare size={12} />}
        >
          <div className="space-y-4">
            <InlineField
              variant="controlled"
              label="Notes"
              type="textarea"
              value={draft.notes ?? ''}
              placeholder="Conversation notes…"
              disabled={formDisabled}
              className={leadStageGateFieldClass(gateRequiredFields, 'notes')}
              onValueChange={(v) => patchDraft({ notes: v || null })}
            />
            <MetaRow
              icon={<Calendar size={12} />}
              label="Created"
              value={formatDate(lead.createdAt)}
            />
            <MetaRow
              icon={<Clock size={12} />}
              label="Updated"
              value={formatDate(lead.updatedAt)}
            />
          </div>
        </DetailSheetSection>
      </div>

      <div className="hidden min-h-[12rem] xl:block" aria-hidden />
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="border-border/60 bg-muted/20 text-muted-foreground flex items-center gap-2 rounded-xl border px-3 py-2 text-sm shadow-sm">
      <span className="text-muted-foreground/70">{icon}</span>
      <span className="font-medium">{label}</span>
      <span className="text-foreground ml-auto tabular-nums">{value}</span>
    </div>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
