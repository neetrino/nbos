'use client';

import { useState } from 'react';
import { DetailSheetFieldSegmented } from '@/components/shared';
import { LeadSvyazatSearchDialog } from './LeadSvyazatSearchDialog';
import { LEAD_SVYAZAT_LABELS } from './lead-svyazat-labels';
import { useSvyazatEntitySearch } from './use-svyazat-search';
import type { SvyazatSearchKind } from './lead-svyazat-search';

type WorkKind = Exclude<SvyazatSearchKind, 'contact'>;

const WORK_KIND_OPTIONS: ReadonlyArray<{ value: WorkKind; label: string }> = [
  { value: 'deal', label: LEAD_SVYAZAT_LABELS.targetDeal },
  { value: 'project', label: LEAD_SVYAZAT_LABELS.targetProject },
  { value: 'lead', label: LEAD_SVYAZAT_LABELS.targetLead },
];

interface LeadSvyazatAttachWorkDialogProps {
  open: boolean;
  excludeLeadId: string;
  applying: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (attach: { type: WorkKind; id: string }) => void;
}

export function LeadSvyazatAttachWorkDialog(props: LeadSvyazatAttachWorkDialogProps) {
  const [kind, setKind] = useState<WorkKind>('deal');
  const search = useSvyazatEntitySearch(props.open, kind, props.excludeLeadId);

  return (
    <LeadSvyazatSearchDialog
      open={props.open}
      title={LEAD_SVYAZAT_LABELS.attachWorkTitle}
      description={LEAD_SVYAZAT_LABELS.attachWorkHint}
      searchLabel={searchLabelFor(kind)}
      placeholder={searchLabelFor(kind)}
      query={search.query}
      hits={search.hits}
      selectedId={search.selectedId}
      loading={search.loading || props.applying}
      error={search.error}
      onQueryChange={search.setQuery}
      onSelect={search.setSelectedId}
      onApply={() => {
        if (!search.selectedId) return;
        props.onApply({ type: kind, id: search.selectedId });
      }}
      onOpenChange={props.onOpenChange}
    >
      <DetailSheetFieldSegmented
        label=""
        hideLabel
        ariaLabel={LEAD_SVYAZAT_LABELS.attachWorkTitle}
        value={kind}
        options={WORK_KIND_OPTIONS}
        onValueChange={(value) => {
          setKind(value);
          search.setSelectedId(null);
        }}
      />
    </LeadSvyazatSearchDialog>
  );
}

function searchLabelFor(kind: WorkKind): string {
  if (kind === 'deal') return LEAD_SVYAZAT_LABELS.searchDeal;
  if (kind === 'project') return LEAD_SVYAZAT_LABELS.searchProject;
  return LEAD_SVYAZAT_LABELS.searchLead;
}
