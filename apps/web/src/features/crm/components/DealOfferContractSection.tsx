'use client';

import { useState } from 'react';
import { Calendar, CheckSquare, Clock, ExternalLink, FileText } from 'lucide-react';
import { InlineField } from '@/components/shared';
import type { DealGeneralDraft } from './deal-general-form-state';
import { DEAL_SHEET_SECTION } from '@/features/shared/crm-sheet-section-ids';
import { EntityDriveQuickAttach } from '@/features/drive/EntityDriveQuickAttach';
import { EntityDriveFilesPanel } from '@/features/drive/EntityDriveFilesPanel';
import { buildDriveHrefWithDeal } from '@/features/drive/drive-deep-link';

interface DealOfferContractSectionProps {
  dealId: string;
  draft: DealGeneralDraft;
  patchDraft: (partial: Partial<DealGeneralDraft>) => void;
  disabled?: boolean;
}

export function DealOfferContractSection({
  dealId,
  draft,
  patchDraft,
  disabled = false,
}: DealOfferContractSectionProps) {
  const [filesRefreshKey, setFilesRefreshKey] = useState(0);
  return (
    <section
      id={DEAL_SHEET_SECTION.OFFER_CONTRACT}
      className="rounded-2xl border border-stone-100 bg-gradient-to-br from-blue-50/40 to-white p-5 dark:border-stone-800 dark:from-blue-950/10 dark:to-transparent"
    >
      <h4 className="text-muted-foreground mb-4 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
        <FileText size={12} />
        Offer & Contract
      </h4>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <InlineField
          variant="controlled"
          label="Offer Sent Date"
          type="date"
          value={draft.offerSentAt ?? ''}
          placeholder="Select offer date..."
          icon={<Calendar size={12} />}
          disabled={disabled}
          onValueChange={(v) => patchDraft({ offerSentAt: v || null })}
        />

        <InlineField
          variant="controlled"
          label="Response Due Date"
          type="date"
          value={draft.responseDueAt ?? ''}
          placeholder="Select response date..."
          icon={<Clock size={12} />}
          disabled={disabled}
          onValueChange={(v) => patchDraft({ responseDueAt: v || null })}
        />

        <InlineField
          variant="controlled"
          label="Offer Link"
          type="link"
          value={draft.offerLink ?? ''}
          placeholder="https://..."
          icon={<ExternalLink size={12} />}
          disabled={disabled}
          onValueChange={(v) => patchDraft({ offerLink: v || null })}
        />

        <InlineField
          variant="controlled"
          label="Offer File URL"
          type="link"
          value={draft.offerFileUrl ?? ''}
          placeholder="https://..."
          icon={<FileText size={12} />}
          disabled={disabled}
          onValueChange={(v) => patchDraft({ offerFileUrl: v || null })}
        />

        <InlineField
          variant="controlled"
          label="Offer Screenshot URL"
          type="link"
          value={draft.offerScreenshotUrl ?? ''}
          placeholder="https://..."
          icon={<ExternalLink size={12} />}
          disabled={disabled}
          onValueChange={(v) => patchDraft({ offerScreenshotUrl: v || null })}
        />

        <InlineField
          variant="controlled"
          label="Contract Signed Date"
          type="date"
          value={draft.contractSignedAt ?? ''}
          placeholder="Select contract date..."
          icon={<CheckSquare size={12} />}
          disabled={disabled}
          onValueChange={(v) => patchDraft({ contractSignedAt: v || null })}
        />

        <InlineField
          variant="controlled"
          label="Contract File URL"
          type="link"
          value={draft.contractFileUrl ?? ''}
          placeholder="https://..."
          icon={<FileText size={12} />}
          disabled={disabled}
          onValueChange={(v) => patchDraft({ contractFileUrl: v || null })}
        />
      </div>

      <div className="mt-4 space-y-3 border-t border-stone-100 pt-4 dark:border-stone-800">
        <EntityDriveQuickAttach
          entityType="DEAL"
          entityId={dealId}
          libraryKey="deals"
          onUploaded={() => setFilesRefreshKey((key) => key + 1)}
        />
        <EntityDriveFilesPanel
          entityType="DEAL"
          entityId={dealId}
          driveHref={buildDriveHrefWithDeal(dealId)}
          refreshKey={filesRefreshKey}
        />
      </div>
    </section>
  );
}
