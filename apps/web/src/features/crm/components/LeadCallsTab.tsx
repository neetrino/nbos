'use client';

import { CrmCallActivityGate } from '@/features/crm/calls/CrmCallActivityGate';
import { CallActivityTimeline } from '@/features/crm/calls/CallActivityTimeline';

export function LeadCallsTab({ leadId }: { leadId: string }) {
  return (
    <CrmCallActivityGate parent="lead">
      <CallActivityTimeline
        key={leadId}
        scope={{ parent: 'lead', id: leadId }}
        emptyTitle="No calls yet"
        emptyDescription="Phone calls with this lead will appear here, organized by date."
      />
    </CrmCallActivityGate>
  );
}
