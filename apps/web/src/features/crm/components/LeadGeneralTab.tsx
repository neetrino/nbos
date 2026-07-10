'use client';

import type { Lead } from '@/lib/api/leads';
import type { LeadMetaConversation } from '@/lib/api/leads';
import type { LeadGeneralDraft } from './lead-general-form-state';
import type { LeadSheetSectionId } from '@/features/shared/crm-sheet-section-ids';
import { LeadCombinedInfoSection } from './LeadCombinedInfoSection';
import { LeadNotesSection } from './LeadNotesSection';
import { DETAIL_SHEET_TAB_BODY_STRETCH_CLASS } from '@/components/shared';
import {
  getLeadLatestMessagePreview,
  getLeadMetaPlatformLabel,
  getLeadCardMetaLabel,
  getLeadDisplayTitle,
} from '../utils/crm-entity-display';

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
      {lead.metaConversation ? (
        <LeadInboundMetaSummary metaConversation={lead.metaConversation} />
      ) : null}
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

function LeadInboundMetaSummary({ metaConversation }: { metaConversation: LeadMetaConversation }) {
  const leadLike = { metaConversation, name: null, code: '', contactName: '' };
  const platform = getLeadMetaPlatformLabel(leadLike);
  const latestMessage = getLeadLatestMessagePreview(leadLike);
  const subtitle = getLeadCardMetaLabel(leadLike);
  return (
    <div className="rounded-lg border border-dashed px-4 py-3">
      <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
        Inbound message
      </p>
      <p className="mt-1 text-sm font-semibold">{getLeadDisplayTitle(leadLike)}</p>
      {subtitle ? <p className="text-muted-foreground text-xs">{subtitle}</p> : null}
      {platform ? <p className="text-muted-foreground mt-1 text-xs">{platform}</p> : null}
      {latestMessage ? (
        <p className="text-muted-foreground mt-2 line-clamp-2 text-sm break-words">
          {latestMessage}
        </p>
      ) : null}
    </div>
  );
}
