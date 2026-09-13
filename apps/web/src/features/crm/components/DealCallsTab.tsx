'use client';

import { useTranslations } from 'next-intl';
import { CrmCallActivityGate } from '@/features/crm/calls/CrmCallActivityGate';
import { CallActivityTimeline } from '@/features/crm/calls/CallActivityTimeline';

export function DealCallsTab({ dealId }: { dealId: string }) {
  const t = useTranslations('crm');
  return (
    <CrmCallActivityGate parent="deal">
      <CallActivityTimeline
        key={dealId}
        scope={{ parent: 'deal', id: dealId }}
        emptyTitle={t('dealSheet.callsEmptyTitle')}
        emptyDescription={t('dealSheet.callsEmptyDescription')}
      />
    </CrmCallActivityGate>
  );
}
