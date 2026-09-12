'use client';

import { useTranslations } from 'next-intl';
import { CrmCallActivityGate } from '@/features/crm/calls/CrmCallActivityGate';
import { CallActivityTimeline } from '@/features/crm/calls/CallActivityTimeline';

export function LeadCallsTab({ leadId }: { leadId: string }) {
  const t = useTranslations('crm');
  return (
    <CrmCallActivityGate parent="lead">
      <CallActivityTimeline
        key={leadId}
        scope={{ parent: 'lead', id: leadId }}
        emptyTitle={t('leadSheet.callsEmptyTitle')}
        emptyDescription={t('leadSheet.callsEmptyDescription')}
      />
    </CrmCallActivityGate>
  );
}
