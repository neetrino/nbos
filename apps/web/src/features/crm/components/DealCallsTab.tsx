'use client';

import { CrmCallActivityGate } from '@/features/crm/calls/CrmCallActivityGate';
import { CallActivityTimeline } from '@/features/crm/calls/CallActivityTimeline';

export function DealCallsTab({ dealId }: { dealId: string }) {
  return (
    <CrmCallActivityGate parent="deal">
      <CallActivityTimeline
        key={dealId}
        scope={{ parent: 'deal', id: dealId }}
        emptyTitle="No calls yet"
        emptyDescription="Phone calls with this deal will appear here, organized by date."
      />
    </CrmCallActivityGate>
  );
}
