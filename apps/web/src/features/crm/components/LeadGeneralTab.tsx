'use client';

import { useCallback, type ReactNode } from 'react';
import { Phone, Mail, User, Calendar, Clock, MessageSquare, Link2, Building2 } from 'lucide-react';
import { DetailSheetSection, StatusBadge, InlineField, SearchField } from '@/components/shared';
import type { Lead } from '@/lib/api/leads';
import { employeesApi } from '@/lib/api/employees';
import type { LeadGeneralDraft } from './lead-general-form-state';
import type { LeadSheetSectionId } from '@/features/shared/crm-sheet-section-ids';
import { LeadGeneralMarketingSection } from './LeadGeneralMarketingSection';

export interface LeadGeneralTabProps {
  lead: Lead;
  draft: LeadGeneralDraft;
  patchDraft: (partial: Partial<LeadGeneralDraft>) => void;
  formDisabled?: boolean;
  sectionIds: {
    contact: LeadSheetSectionId;
    marketing: LeadSheetSectionId;
    assignment: LeadSheetSectionId;
  };
}

export function LeadGeneralTab({
  lead,
  draft,
  patchDraft,
  formDisabled = false,
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
    <div className="space-y-6">
      <DetailSheetSection id={sectionIds.contact} title="Contact" icon={<User size={12} />}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InlineField
            variant="controlled"
            label="Contact name"
            type="text"
            value={draft.contactName}
            placeholder="Contact name…"
            icon={<User size={12} />}
            disabled={formDisabled}
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
      />

      <DetailSheetSection id={sectionIds.assignment} title="Team" icon={<Building2 size={12} />}>
        <SearchField
          selectionMode="stage"
          label="Seller"
          value={draft.assignedTo}
          displayValue={
            draft.sellerDisplayLabel ? (
              <span className="text-foreground text-sm font-medium">
                {draft.sellerDisplayLabel}
              </span>
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
          <div className="border-border bg-muted/20 flex items-center gap-3 rounded-xl border p-3">
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

      <DetailSheetSection title="Notes & activity" icon={<MessageSquare size={12} />}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InlineField
            variant="controlled"
            label="Notes"
            type="textarea"
            value={draft.notes ?? ''}
            placeholder="Conversation notes…"
            disabled={formDisabled}
            onValueChange={(v) => patchDraft({ notes: v || null })}
          />
          <div className="space-y-3 text-sm">
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
        </div>
      </DetailSheetSection>
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="text-muted-foreground flex items-center gap-2">
      {icon}
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
