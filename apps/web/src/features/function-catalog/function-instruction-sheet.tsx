'use client';

import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { useTranslations } from 'next-intl';
import { BadgeCheck, FileText, ScanSearch } from 'lucide-react';
import { DETAIL_SHEET_TAB_BODY_STRETCH_CLASS, InsightSheetSection } from '@/components/shared';

export function FunctionInstructionSheet({ item }: { item: DeliveryFunctionOperationalDto }) {
  const t = useTranslations('hr.functionCatalog');

  return (
    <div className={`${DETAIL_SHEET_TAB_BODY_STRETCH_CLASS} gap-4`}>
      <InsightSheetSection icon={<ScanSearch size={15} />} title={t('scope')}>
        <p className="text-foreground text-sm whitespace-pre-wrap">{item.scopeBoundaries}</p>
      </InsightSheetSection>
      <InsightSheetSection icon={<FileText size={15} />} title={t('instructions')}>
        <p className="text-foreground text-sm whitespace-pre-wrap">{item.instructions}</p>
      </InsightSheetSection>
      <InsightSheetSection icon={<BadgeCheck size={15} />} title={t('acceptance')}>
        <p className="text-foreground text-sm whitespace-pre-wrap">{item.acceptanceCriteria}</p>
      </InsightSheetSection>
    </div>
  );
}
