'use client';

import { CrmCallActivityGate } from '@/features/crm/calls/CrmCallActivityGate';
import { CallActivityTimeline } from '@/features/crm/calls/CallActivityTimeline';

export function LeadHistoryTab({ leadId }: { leadId: string }) {
  return (
    <CrmCallActivityGate parent="lead">
      <CallActivityTimeline
        key={leadId}
        scope={{ parent: 'lead', id: leadId }}
        emptyDescription="Calls with this lead will appear here alongside other activities."
      />
    </CrmCallActivityGate>
  );
}
