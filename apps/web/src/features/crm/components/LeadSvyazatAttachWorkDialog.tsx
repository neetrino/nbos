'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DetailSheetFieldSegmented } from '@/components/shared';
import { LeadSvyazatSearchDialog } from './LeadSvyazatSearchDialog';
import { useSvyazatEntitySearch } from './use-svyazat-search';
import type { SvyazatSearchKind } from './lead-svyazat-search';

type WorkKind = Exclude<SvyazatSearchKind, 'contact'>;

interface LeadSvyazatAttachWorkDialogProps {
  open: boolean;
  excludeLeadId: string;
  applying: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (attach: { type: WorkKind; id: string }) => void;
}

export function LeadSvyazatAttachWorkDialog(props: LeadSvyazatAttachWorkDialogProps) {
  const t = useTranslations('crm');
  const [kind, setKind] = useState<WorkKind>('deal');
  const search = useSvyazatEntitySearch(props.open, kind, props.excludeLeadId);
  const workKindOptions: ReadonlyArray<{ value: WorkKind; label: string }> = [
    { value: 'deal', label: t('svyazat.targetDeal') },
    { value: 'project', label: t('svyazat.targetProject') },
    { value: 'product', label: t('svyazat.targetProduct') },
    { value: 'lead', label: t('svyazat.targetLead') },
  ];

  return (
    <LeadSvyazatSearchDialog
      open={props.open}
      title={t('svyazat.attachWorkTitle')}
      description={t('svyazat.attachWorkHint')}
      searchLabel={searchLabelFor(kind, t)}
      placeholder={searchLabelFor(kind, t)}
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
        ariaLabel={t('svyazat.attachWorkTitle')}
        value={kind}
        options={workKindOptions}
        onValueChange={(value) => {
          setKind(value);
          search.setSelectedId(null);
        }}
      />
    </LeadSvyazatSearchDialog>
  );
}

function searchLabelFor(
  kind: WorkKind,
  t: ReturnType<typeof useTranslations<'crm'>>,
): string {
  if (kind === 'deal') return t('svyazat.searchDeal');
  if (kind === 'project') return t('svyazat.searchProject');
  if (kind === 'product') return t('svyazat.searchProduct');
  return t('svyazat.searchLead');
}
