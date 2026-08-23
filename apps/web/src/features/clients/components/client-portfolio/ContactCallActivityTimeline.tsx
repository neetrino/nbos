'use client';

import { CrmCallActivityGate } from '@/features/crm/calls/CrmCallActivityGate';
import { CallActivityTimeline } from '@/features/crm/calls/CallActivityTimeline';

export function ContactCallActivityTimeline({ contactId }: { contactId: string }) {
  return (
    <CrmCallActivityGate parent="contact">
      <CallActivityTimeline
        key={contactId}
        scope={{ parent: 'contact', id: contactId }}
        emptyDescription="Calls with this contact will appear here in the communication timeline."
      />
    </CrmCallActivityGate>
  );
}
