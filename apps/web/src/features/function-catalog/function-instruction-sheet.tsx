'use client';

import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { useTranslations } from 'next-intl';
import { DETAIL_SHEET_TAB_BODY_STRETCH_CLASS, DetailSheetSection } from '@/components/shared';

export function FunctionInstructionSheet({ item }: { item: DeliveryFunctionOperationalDto }) {
  const t = useTranslations('hr.functionCatalog');

  return (
    <div className={`${DETAIL_SHEET_TAB_BODY_STRETCH_CLASS} gap-4`}>
      <DetailSheetSection title={t('scope')}>
        <p className="text-foreground text-sm whitespace-pre-wrap">{item.scopeBoundaries}</p>
      </DetailSheetSection>
      <DetailSheetSection title={t('instructions')}>
        <p className="text-foreground text-sm whitespace-pre-wrap">{item.instructions}</p>
      </DetailSheetSection>
      <DetailSheetSection title={t('acceptance')}>
        <p className="text-foreground text-sm whitespace-pre-wrap">{item.acceptanceCriteria}</p>
      </DetailSheetSection>
    </div>
  );
}
