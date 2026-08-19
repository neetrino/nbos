'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LeadSvyazatSearchDialog } from './LeadSvyazatSearchDialog';
import { LEAD_SVYAZAT_LABELS } from './lead-svyazat-labels';
import { useSvyazatEntitySearch, type SvyazatSearchKind } from './use-svyazat-search';

type WorkKind = Exclude<SvyazatSearchKind, 'contact'>;

const WORK_KINDS: Array<{ id: WorkKind; label: string }> = [
  { id: 'deal', label: LEAD_SVYAZAT_LABELS.targetDeal },
  { id: 'project', label: LEAD_SVYAZAT_LABELS.targetProject },
  { id: 'lead', label: LEAD_SVYAZAT_LABELS.targetLead },
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
      searchLabel={searchLabelFor(kind)}
      placeholder={LEAD_SVYAZAT_LABELS.attachWorkHint}
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
      <div className="flex flex-wrap gap-1.5">
        {WORK_KINDS.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={kind === item.id ? 'default' : 'outline'}
            onClick={() => {
              setKind(item.id);
              search.setSelectedId(null);
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </LeadSvyazatSearchDialog>
  );
}

function searchLabelFor(kind: WorkKind): string {
  if (kind === 'deal') return LEAD_SVYAZAT_LABELS.searchDeal;
  if (kind === 'project') return LEAD_SVYAZAT_LABELS.searchProject;
  return LEAD_SVYAZAT_LABELS.searchLead;
}
