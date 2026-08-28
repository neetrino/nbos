'use client';

import { CrmCallActivityGate } from '@/features/crm/calls/CrmCallActivityGate';
import { CallActivityTimeline } from '@/features/crm/calls/CallActivityTimeline';

export function ContactCallsTab({ contactId }: { contactId: string }) {
  return (
    <CrmCallActivityGate parent="contact">
      <CallActivityTimeline
        key={contactId}
        scope={{ parent: 'contact', id: contactId }}
        emptyTitle="No calls yet"
        emptyDescription="Phone calls with this contact will appear here, organized by date."
      />
    </CrmCallActivityGate>
  );
}
