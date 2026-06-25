'use client';

import type { Lead } from '@/lib/api/leads';
import type { LeadGeneralDraft } from './lead-general-form-state';
import type { LeadSheetSectionId } from '@/features/shared/crm-sheet-section-ids';
import { LeadCombinedInfoSection } from './LeadCombinedInfoSection';
import { LeadNotesSection } from './LeadNotesSection';
import { DETAIL_SHEET_TAB_BODY_STRETCH_CLASS } from '@/components/shared';

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
  return (
    <div
      className={`${DETAIL_SHEET_TAB_BODY_STRETCH_CLASS} mx-auto w-full max-w-[48rem] min-w-0 gap-4`}
    >
      <LeadCombinedInfoSection
        lead={lead}
        draft={draft}
        patchDraft={patchDraft}
        formDisabled={formDisabled}
        gateRequiredFields={gateRequiredFields}
        sectionIds={{
          contact: sectionIds.contact,
          marketing: sectionIds.marketing,
          assignment: sectionIds.assignment,
        }}
      />
      <LeadEntityMetaLine createdAt={lead.createdAt} updatedAt={lead.updatedAt} />
      <LeadNotesSection
        id={sectionIds.notes}
        entityId={lead.id}
        draft={draft}
        patchDraft={patchDraft}
        disabled={formDisabled}
        gateRequiredFields={gateRequiredFields}
      />
    </div>
  );
}

interface LeadEntityMetaLineProps {
  createdAt: string;
  updatedAt: string;
}

function LeadEntityMetaLine({ createdAt, updatedAt }: LeadEntityMetaLineProps) {
  return (
    <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 px-1 text-[11px] tabular-nums">
      <span>
        <span className="font-medium">Created</span> {formatLeadMetaDate(createdAt)}
      </span>
      <span aria-hidden className="text-muted-foreground/50">
        ·
      </span>
      <span>
        <span className="font-medium">Last updated</span> {formatLeadMetaDate(updatedAt)}
      </span>
    </p>
  );
}

function formatLeadMetaDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
