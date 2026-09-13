'use client';

import { useTranslations } from 'next-intl';
import { CrmCallActivityGate } from '@/features/crm/calls/CrmCallActivityGate';
import { CallActivityTimeline } from '@/features/crm/calls/CallActivityTimeline';

export function ContactCallsTab({ contactId }: { contactId: string }) {
  const t = useTranslations('crm');
  return (
    <CrmCallActivityGate parent="contact">
      <CallActivityTimeline
        key={contactId}
        scope={{ parent: 'contact', id: contactId }}
        emptyTitle={t('calls.noCallsYet')}
        emptyDescription={t('calls.noCallsDescription')}
      />
    </CrmCallActivityGate>
  );
}
