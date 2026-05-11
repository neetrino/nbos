'use client';

import { Phone, Mail, User, Calendar, Clock, MessageSquare, Link2 } from 'lucide-react';
import { StatusBadge, InlineField } from '@/components/shared';
import type { Lead } from '@/lib/api/leads';
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
  return (
    <div className="space-y-8">
      <div id={sectionIds.contact}>
        <h3 className="text-muted-foreground mb-4 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
          <User size={13} />
          Contact Information
        </h3>
        <div className="grid grid-cols-2 gap-x-10 gap-y-3">
          <InlineField
            variant="controlled"
            label="Contact Name"
            type="text"
            value={draft.contactName}
            placeholder="Contact name..."
            icon={<User size={12} />}
            disabled={formDisabled}
            onValueChange={(v) => patchDraft({ contactName: v })}
          />

          <InlineField
            variant="controlled"
            label="Phone"
            type="phone"
            value={draft.phone ?? ''}
            placeholder="+374..."
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
      </div>

      <LeadGeneralMarketingSection
        lead={lead}
        draft={draft}
        patchDraft={patchDraft}
        formDisabled={formDisabled}
        sectionId={sectionIds.marketing}
      />

      <div id={sectionIds.assignment}>
        <h3 className="text-muted-foreground mb-4 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
          <User size={13} />
          Assignment
        </h3>
        <div className="grid grid-cols-2 gap-x-10 gap-y-3">
          <InlineField
            label="Assigned Seller"
            value={lead.assignee ? `${lead.assignee.firstName} ${lead.assignee.lastName}` : ''}
            displayValue={
              lead.assignee ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                    {lead.assignee.firstName[0]}
                    {lead.assignee.lastName[0]}
                  </div>
                  <span className="text-foreground text-sm font-medium">
                    {lead.assignee.firstName} {lead.assignee.lastName}
                  </span>
                </div>
              ) : undefined
            }
            editable={false}
            icon={<User size={12} />}
          />
        </div>
      </div>

      {lead.deal ? (
        <div>
          <h3 className="text-muted-foreground mb-4 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
            <Link2 size={13} />
            Linked Deal
          </h3>
          <div className="border-border hover:bg-muted/50 flex items-center gap-3 rounded-xl border p-3 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <Link2 size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{lead.deal.code}</p>
              <StatusBadge label={lead.deal.status.replace(/_/g, ' ')} variant="blue" />
            </div>
          </div>
        </div>
      ) : null}

      <div>
        <h3 className="text-muted-foreground mb-4 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
          <Calendar size={13} />
          Dates
        </h3>
        <div className="grid grid-cols-2 gap-x-10 gap-y-3">
          <InlineField
            label="Created"
            value={new Date(lead.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
            icon={<Calendar size={12} />}
            editable={false}
          />

          <InlineField
            label="Last Updated"
            value={new Date(lead.updatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
            icon={<Clock size={12} />}
            editable={false}
          />
        </div>
      </div>

      <div>
        <h3 className="text-muted-foreground mb-4 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
          <MessageSquare size={13} />
          Notes
        </h3>
        <InlineField
          variant="controlled"
          label=""
          type="textarea"
          value={draft.notes ?? ''}
          placeholder="Add notes about this lead..."
          icon={<MessageSquare size={12} />}
          disabled={formDisabled}
          onValueChange={(v) => patchDraft({ notes: v || null })}
        />
      </div>
    </div>
  );
}
